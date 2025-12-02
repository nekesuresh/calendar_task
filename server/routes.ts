import type { Express } from "express";
import { type Server } from "http";
import { getUncachableGoogleCalendarClient, getOrganizerEmail } from "./google-calendar";
import { getRecentRecordings } from "./google-drive";
import { insertEventSchema, type Event, type Organizer, type RecordingStatus } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

function formatDateTimeForGoogleCalendar(dateTime: string): string {
  if (dateTime.length === 16) {
    return dateTime + ":00";
  }
  return dateTime;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get organizer information
  app.get("/api/organizer", async (req, res) => {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      const calendarList = await calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
      
      const organizer: Organizer = {
        email: primaryCalendar?.id || 'primary',
        name: primaryCalendar?.summary || undefined,
      };
      
      res.json(organizer);
    } catch (error: any) {
      console.error('Error getting organizer:', error);
      res.status(500).json({ message: error.message || 'Failed to get organizer information' });
    }
  });

  // List all events
  app.get("/api/events", async (req, res) => {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 30);
      
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 365);
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: pastDate.toISOString(),
        timeMax: futureDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const editableEvents = (response.data.items || []).filter((event: any) => {
        const eventType = event.eventType;
        return !eventType || eventType === 'default';
      });

      // Fetch recordings from Google Drive (graceful fallback if Drive not connected)
      let recordings: Array<{ fileId: string; webViewLink: string; name: string; createdTime: string }> = [];
      let driveAvailable = true;
      try {
        recordings = await getRecentRecordings();
      } catch (error: any) {
        console.log('Google Drive not available for recordings:', error.message);
        driveAvailable = false;
      }

      const events: Event[] = editableEvents.map((event: any) => {
        const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null;
        const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
        
        // Try to find a matching recording for this event
        let recordingStatus: RecordingStatus = 'not_available';
        let recordingUrl: string | null = null;
        
        if (meetLink && driveAvailable) {
          // Extract meeting code from the Meet link
          const meetCodeMatch = meetLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
          const eventTitle = (event.summary || '').toLowerCase();
          
          // Look for a recording that matches this event
          for (const recording of recordings) {
            const recordingName = recording.name.toLowerCase();
            const recordingDate = new Date(recording.createdTime);
            
            // Check if recording was created around the same time as the event
            const timeDiff = Math.abs(recordingDate.getTime() - eventDate.getTime());
            const withinTimeWindow = timeDiff < 48 * 60 * 60 * 1000; // Within 48 hours
            
            // Match by title similarity or meeting code
            const titleMatch = eventTitle && recordingName.includes(eventTitle.slice(0, 10));
            const codeMatch = meetCodeMatch && recordingName.includes(meetCodeMatch[1].replace(/-/g, ''));
            
            if (withinTimeWindow && (titleMatch || codeMatch || recordingName.includes('meet'))) {
              recordingStatus = 'available';
              recordingUrl = recording.webViewLink;
              break;
            }
          }
        }
        
        return {
          id: event.id || '',
          title: event.summary || 'Untitled Session',
          startTime: event.start?.dateTime || event.start?.date || '',
          endTime: event.end?.dateTime || event.end?.date || '',
          timezone: event.start?.timeZone || 'UTC',
          participants: (event.attendees || []).map((a: any) => a.email).filter(Boolean),
          meetLink,
          description: event.description || null,
          recordingStatus,
          recordingUrl,
        };
      });

      res.json(events);
    } catch (error: any) {
      console.error('Error listing events:', error);
      res.status(500).json({ message: error.message || 'Failed to list events' });
    }
  });

  // Create new event
  app.post("/api/events", async (req, res) => {
    try {
      const validationResult = insertEventSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const eventData = validationResult.data;
      const calendar = await getUncachableGoogleCalendarClient();

      const attendees = eventData.participants.map(email => ({ email }));

      const newEvent = {
        summary: eventData.title,
        description: eventData.description || undefined,
        start: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.startTime),
          timeZone: eventData.timezone,
        },
        end: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.endTime),
          timeZone: eventData.timezone,
        },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: newEvent,
        sendUpdates: 'all',
      });

      const createdEvent: Event = {
        id: response.data.id || '',
        title: response.data.summary || '',
        startTime: response.data.start?.dateTime || response.data.start?.date || '',
        endTime: response.data.end?.dateTime || response.data.end?.date || '',
        timezone: response.data.start?.timeZone || 'UTC',
        participants: (response.data.attendees || []).map((a: any) => a.email).filter(Boolean),
        meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
        description: response.data.description || null,
      };

      res.status(201).json(createdEvent);
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: error.message || 'Failed to create event' });
    }
  });

  // Update event
  app.put("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertEventSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const eventData = validationResult.data;
      const calendar = await getUncachableGoogleCalendarClient();

      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: id,
      });

      const attendees = eventData.participants.map(email => ({ email }));

      const updatedEvent = {
        summary: eventData.title,
        description: eventData.description || undefined,
        start: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.startTime),
          timeZone: eventData.timezone,
        },
        end: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.endTime),
          timeZone: eventData.timezone,
        },
        attendees,
        conferenceData: existingEvent.data.conferenceData,
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: id,
        requestBody: updatedEvent,
        sendUpdates: 'all',
      });

      const event: Event = {
        id: response.data.id || '',
        title: response.data.summary || '',
        startTime: response.data.start?.dateTime || response.data.start?.date || '',
        endTime: response.data.end?.dateTime || response.data.end?.date || '',
        timezone: response.data.start?.timeZone || 'UTC',
        participants: (response.data.attendees || []).map((a: any) => a.email).filter(Boolean),
        meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
        description: response.data.description || null,
      };

      res.json(event);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: error.message || 'Failed to update event' });
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const calendar = await getUncachableGoogleCalendarClient();

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: id,
        sendUpdates: 'all',
      });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: error.message || 'Failed to delete event' });
    }
  });

  return httpServer;
}
