import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast } from "date-fns";
import type { Event } from "@shared/schema";
import { EventCard } from "./event-card";

interface CalendarViewProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  currentDate: Date;
}

export function CalendarView({ events, onEdit, onDelete, currentDate }: CalendarViewProps) {
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => new Date(event.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const completedEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => new Date(event.endTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [events]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-6 text-navy dark:text-white flex items-center gap-2" data-testid="text-upcoming-title">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Upcoming Sessions
        </h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p data-testid="text-no-upcoming">No upcoming sessions scheduled</p>
          </div>
        )}
      </section>

      {completedEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-navy dark:text-white opacity-70 flex items-center gap-2" data-testid="text-completed-title">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Completed Sessions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
