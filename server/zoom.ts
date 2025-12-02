const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_url: string;
  password: string;
  topic: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom API credentials not configured");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom token error:", errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export interface CreateMeetingParams {
  topic: string;
  startTime: string;
  duration: number;
  timezone: string;
}

export interface ZoomMeeting {
  id: number;
  joinUrl: string;
  startUrl: string;
  password: string;
}

export async function createZoomMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2,
      start_time: params.startTime,
      duration: params.duration,
      timezone: params.timezone,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: "cloud",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom meeting creation error:", errorText);
    throw new Error(`Failed to create Zoom meeting: ${response.status}`);
  }

  const data: ZoomMeetingResponse = await response.json();

  return {
    id: data.id,
    joinUrl: data.join_url,
    startUrl: data.start_url,
    password: data.password,
  };
}

export async function deleteZoomMeeting(meetingId: number): Promise<void> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    console.error("Zoom meeting deletion error:", errorText);
    throw new Error(`Failed to delete Zoom meeting: ${response.status}`);
  }
}

export async function getZoomRecordings(meetingId: number): Promise<string | null> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    return null;
  }

  const data = await response.json();
  
  if (data.recording_files && data.recording_files.length > 0) {
    const sharedRecording = data.recording_files.find((f: any) => f.file_type === "SHARED_SCREEN_WITH_SPEAKER_VIEW" || f.file_type === "MP4");
    if (sharedRecording) {
      return sharedRecording.play_url || sharedRecording.download_url;
    }
    return data.recording_files[0].play_url || data.recording_files[0].download_url;
  }

  return null;
}
