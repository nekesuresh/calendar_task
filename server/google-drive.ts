// Google Drive integration for fetching Meet recordings
// Uses Replit Connector for OAuth management
import { google } from 'googleapis';

let driveConnectionSettings: any;

async function getDriveAccessToken() {
  if (driveConnectionSettings && driveConnectionSettings.settings.expires_at && new Date(driveConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return driveConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  driveConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = driveConnectionSettings?.settings?.access_token || driveConnectionSettings.settings?.oauth?.credentials?.access_token;

  if (!driveConnectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableGoogleDriveClient() {
  const accessToken = await getDriveAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Search for Meet recordings in Google Drive
// Recordings are saved to a "Meet Recordings" folder by Google Meet
export async function findMeetRecording(meetLink: string): Promise<{ fileId: string; webViewLink: string; name: string } | null> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    // Extract the meeting code from the Meet link
    // Format: https://meet.google.com/xxx-xxxx-xxx
    const meetCodeMatch = meetLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    if (!meetCodeMatch) {
      console.log('Could not extract meeting code from:', meetLink);
      return null;
    }
    
    const meetCode = meetCodeMatch[1];
    console.log('Searching for recording with meeting code:', meetCode);
    
    // Search for video files that might be Meet recordings
    // Meet recordings are typically named with the meeting title and date
    const response = await drive.files.list({
      q: `mimeType contains 'video/' and trashed = false`,
      fields: 'files(id, name, webViewLink, mimeType, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });

    const files = response.data.files || [];
    
    // Look for files that might be Meet recordings
    // They are typically in the format: "Meeting Title (Meeting Date)"
    for (const file of files) {
      // Check if the filename contains the meeting code or looks like a Meet recording
      if (file.name && (
        file.name.toLowerCase().includes(meetCode.replace(/-/g, '')) ||
        file.name.includes('Meet Recording') ||
        file.name.includes('meet_recording')
      )) {
        console.log('Found potential recording:', file.name);
        return {
          fileId: file.id || '',
          webViewLink: file.webViewLink || '',
          name: file.name || 'Recording',
        };
      }
    }

    console.log('No recording found for meeting code:', meetCode);
    return null;
  } catch (error: any) {
    console.error('Error searching for recording:', error.message);
    return null;
  }
}

// Get all recent video files that could be recordings
export async function getRecentRecordings(): Promise<Array<{ fileId: string; webViewLink: string; name: string; createdTime: string }>> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const response = await drive.files.list({
      q: `mimeType contains 'video/' and trashed = false and createdTime > '${thirtyDaysAgo.toISOString()}'`,
      fields: 'files(id, name, webViewLink, mimeType, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 100,
    });

    return (response.data.files || []).map(file => ({
      fileId: file.id || '',
      webViewLink: file.webViewLink || '',
      name: file.name || 'Recording',
      createdTime: file.createdTime || '',
    }));
  } catch (error: any) {
    console.error('Error fetching recent recordings:', error.message);
    return [];
  }
}
