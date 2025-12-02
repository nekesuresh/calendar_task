import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  startTime: z.string(),
  endTime: z.string(),
  timezone: z.string(),
  participants: z.array(z.string().email()).max(6),
  meetLink: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const insertEventSchema = z.object({
  title: z.string().min(1, "Session title is required").max(100, "Title must be 100 characters or less"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  participants: z.array(z.string().email("Invalid email address")).max(6, "Maximum 6 participants allowed"),
  description: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const organizerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Organizer = z.infer<typeof organizerSchema>;
