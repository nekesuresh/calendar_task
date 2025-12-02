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

interface ZoomRecordingFile {
  id: string;
  file_type: string;
  play_url?: string;
  download_url?: string;
  recording_type?: string;
}

interface ZoomRecordingsResponse {
  share_url?: string;
  password?: string;
  recording_files?: ZoomRecordingFile[];
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function clearTokenCache(): void {
  cachedToken = null;
  console.log("[Zoom] Token cache cleared");
}

async function getZoomAccessToken(forceRefresh: boolean = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom API credentials not configured");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  console.log("[Zoom] Fetching new access token...");
  
  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Zoom] Token error:", response.status, errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  console.log("[Zoom] Access token obtained successfully");
  return data.access_token;
}

async function zoomApiCall<T>(
  url: string,
  options: RequestInit,
  retryOnAuth: boolean = true
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const accessToken = await getZoomAccessToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 && retryOnAuth) {
    console.log("[Zoom] Got 401, refreshing token and retrying...");
    clearTokenCache();
    return zoomApiCall(url, options, false);
  }

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, error: errorText };
  }

  if (response.status === 204) {
    return { ok: true, status: 204 };
  }

  const data = await response.json();
  return { ok: true, status: response.status, data };
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
  const result = await zoomApiCall<ZoomMeetingResponse>(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      method: "POST",
      headers: {
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
    }
  );

  if (!result.ok || !result.data) {
    console.error("[Zoom] Meeting creation failed:", result.status, result.error);
    throw new Error(`Failed to create Zoom meeting: ${result.status}`);
  }

  console.log("[Zoom] Meeting created successfully:", result.data.id);

  return {
    id: result.data.id,
    joinUrl: result.data.join_url,
    startUrl: result.data.start_url,
    password: result.data.password,
  };
}

export async function deleteZoomMeeting(meetingId: number): Promise<void> {
  const result = await zoomApiCall(
    `https://api.zoom.us/v2/meetings/${meetingId}`,
    { method: "DELETE" }
  );

  if (!result.ok && result.status !== 404) {
    console.error("[Zoom] Meeting deletion failed:", meetingId, result.status, result.error);
    throw new Error(`Failed to delete Zoom meeting: ${result.status}`);
  }

  if (result.status === 404) {
    console.log("[Zoom] Meeting already deleted or not found:", meetingId);
  } else {
    console.log("[Zoom] Meeting deleted successfully:", meetingId);
  }
}

export interface RecordingResult {
  shareUrl: string | null;
  password?: string;
  error?: string;
  errorCode?: number;
}

function getErrorMessage(status: number | undefined): string {
  switch (status) {
    case 429:
      return "Too many requests - please try again later.";
    case 401:
      return "Authentication failed - please reconnect Zoom.";
    case 403:
    case 400:
      return "Recording sharing requires Zoom Pro or recording:write scope.";
    case 404:
      return "Recording not found.";
    case 500:
    case 502:
    case 503:
      return "Zoom service error - please try again later.";
    default:
      return "Recording exists but cannot be shared publicly.";
  }
}

interface SharingResult {
  success: boolean;
  status?: number;
  error?: string;
}

async function enablePublicSharing(meetingId: number): Promise<SharingResult> {
  console.log("[Zoom] Enabling public sharing for meeting:", meetingId);
  
  const result = await zoomApiCall(
    `https://api.zoom.us/v2/meetings/${meetingId}/recordings/settings`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        share_recording: "publicly",
        recording_authentication: false,
        viewer_download: true,
        on_demand: false,
        password: "",
      }),
    }
  );

  if (!result.ok) {
    console.error("[Zoom] Failed to enable public sharing:", meetingId, result.status, result.error);
    return { success: false, status: result.status, error: result.error };
  }

  console.log("[Zoom] Public sharing enabled for meeting:", meetingId);
  return { success: true };
}

export async function getZoomRecordings(meetingId: number): Promise<RecordingResult> {
  const result = await zoomApiCall<ZoomRecordingsResponse>(
    `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
    { method: "GET" }
  );

  if (!result.ok) {
    if (result.status === 404) {
      console.log("[Zoom] No recording found for meeting:", meetingId);
      return { shareUrl: null };
    }

    console.error("[Zoom] Failed to fetch recording:", meetingId, result.status, result.error);
    const errorMessage = getErrorMessage(result.status);
    return { shareUrl: null, error: errorMessage, errorCode: result.status };
  }

  const data = result.data;
  
  if (!data) {
    return { shareUrl: null };
  }

  if (data.share_url) {
    console.log("[Zoom] Recording share URL found for meeting:", meetingId);
    return { shareUrl: data.share_url, password: data.password };
  }

  if (data.recording_files && data.recording_files.length > 0) {
    const sharingResult = await enablePublicSharing(meetingId);
    
    if (sharingResult.success) {
      const retryResult = await zoomApiCall<ZoomRecordingsResponse>(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        { method: "GET" }
      );
      
      if (retryResult.ok && retryResult.data?.share_url) {
        console.log("[Zoom] Recording share URL obtained after enabling sharing:", meetingId);
        return { shareUrl: retryResult.data.share_url, password: retryResult.data.password };
      }

      if (!retryResult.ok) {
        console.warn("[Zoom] Retry GET failed after enabling sharing:", meetingId, retryResult.status);
        const errorMessage = getErrorMessage(retryResult.status);
        return { shareUrl: null, error: errorMessage, errorCode: retryResult.status };
      }

      console.warn("[Zoom] Share URL not available after enabling sharing:", meetingId);
      return { shareUrl: null, error: "Recording processing - please try again later.", errorCode: 202 };
    }

    console.warn("[Zoom] Recording exists but public sharing could not be enabled for meeting:", meetingId);
    const errorMessage = getErrorMessage(sharingResult.status);
    return { 
      shareUrl: null, 
      error: errorMessage,
      errorCode: sharingResult.status || 500 
    };
  }

  console.log("[Zoom] No usable recording URL found for meeting:", meetingId);
  return { shareUrl: null };
}
