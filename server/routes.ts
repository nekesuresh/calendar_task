import type { Express } from "express";
import { type Server } from "http";
import { getUncachableGoogleCalendarClient, getOrganizerEmail } from "./google-calendar";
import { createZoomMeeting, getZoomRecordings, deleteZoomMeeting } from "./zoom";
import { insertEventSchema, type Event, type Organizer } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

function formatDateTimeForGoogleCalendar(dateTime: string): string {
  if (dateTime.length === 16) {
    return dateTime + ":00";
  }
  return dateTime;
}

function extractZoomMeetingId(description: string | null | undefined): number | null {
  if (!description) return null;
  const match = description.match(/\[ZoomMeetingId:(\d+)\]/);
  return match ? parseInt(match[1], 10) : null;
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / 60000);
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

      const events: Event[] = await Promise.all(editableEvents.map(async (event: any) => {
        const zoomMeetingId = extractZoomMeetingId(event.description);
        let recordingLink: string | null = null;
        
        if (zoomMeetingId) {
          try {
            recordingLink = await getZoomRecordings(zoomMeetingId);
          } catch (e) {
            console.log('Could not fetch recording for meeting:', zoomMeetingId);
          }
        }

        const zoomLinkMatch = event.description?.match(/Zoom Meeting: (https:\/\/[^\s\n]+)/);
        const zoomLink = zoomLinkMatch ? zoomLinkMatch[1] : null;

        let cleanDescription = event.description || null;
        if (cleanDescription) {
          cleanDescription = cleanDescription
            .replace(/\n\nZoom Meeting: https:\/\/[^\s\n]+/, '')
            .replace(/\n\[ZoomMeetingId:\d+\]/, '')
            .trim() || null;
        }

        return {
          id: event.id || '',
          title: event.summary || 'Untitled Session',
          startTime: event.start?.dateTime || event.start?.date || '',
          endTime: event.end?.dateTime || event.end?.date || '',
          timezone: event.start?.timeZone || 'UTC',
          participants: (event.attendees || []).map((a: any) => a.email).filter(Boolean),
          meetLink: zoomLink || event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
          recordingLink,
          description: cleanDescription,
        };
      }));

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
      
      const zoomMeeting = await createZoomMeeting({
        topic: eventData.title,
        startTime: formatDateTimeForGoogleCalendar(eventData.startTime),
        duration: calculateDurationMinutes(eventData.startTime, eventData.endTime),
        timezone: eventData.timezone,
      });

      const calendar = await getUncachableGoogleCalendarClient();

      const attendees = eventData.participants.map(email => ({ email }));

      const descriptionWithZoom = [
        eventData.description || '',
        `\n\nZoom Meeting: ${zoomMeeting.joinUrl}`,
        `\n[ZoomMeetingId:${zoomMeeting.id}]`
      ].join('');

      const newEvent = {
        summary: eventData.title,
        description: descriptionWithZoom,
        start: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.startTime),
          timeZone: eventData.timezone,
        },
        end: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.endTime),
          timeZone: eventData.timezone,
        },
        attendees,
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
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
        meetLink: zoomMeeting.joinUrl,
        recordingLink: null,
        description: eventData.description || null,
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

      const existingZoomMeetingId = extractZoomMeetingId(existingEvent.data.description);
      const zoomLinkMatch = existingEvent.data.description?.match(/Zoom Meeting: (https:\/\/[^\s\n]+)/);
      const existingZoomLink = zoomLinkMatch ? zoomLinkMatch[1] : null;

      const attendees = eventData.participants.map(email => ({ email }));

      let descriptionWithZoom = eventData.description || '';
      if (existingZoomLink && existingZoomMeetingId) {
        descriptionWithZoom = [
          eventData.description || '',
          `\n\nZoom Meeting: ${existingZoomLink}`,
          `\n[ZoomMeetingId:${existingZoomMeetingId}]`
        ].join('');
      }

      const updatedEvent = {
        summary: eventData.title,
        description: descriptionWithZoom,
        start: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.startTime),
          timeZone: eventData.timezone,
        },
        end: {
          dateTime: formatDateTimeForGoogleCalendar(eventData.endTime),
          timeZone: eventData.timezone,
        },
        attendees,
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
        meetLink: existingZoomLink || null,
        recordingLink: null,
        description: eventData.description || null,
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

      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: id,
      });

      const zoomMeetingId = extractZoomMeetingId(existingEvent.data.description);
      
      if (zoomMeetingId) {
        try {
          await deleteZoomMeeting(zoomMeetingId);
        } catch (e) {
          console.log('Could not delete Zoom meeting:', zoomMeetingId);
        }
      }

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
