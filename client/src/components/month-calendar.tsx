import { useMemo, useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@shared/schema";

interface MonthCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateClick: (date: Date) => void;
}

export function MonthCalendar({ events, onEventClick, onDateClick }: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-card rounded-2xl border-2 shadow-md overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-teal/10 to-yellow/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            data-testid="button-prev-month"
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-navy dark:text-white min-w-[180px] text-center" data-testid="text-current-month">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            data-testid="button-next-month"
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          data-testid="button-today"
          className="rounded-full"
        >
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-muted-foreground border-b bg-muted/30"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day)}
              data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
              className={`min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors hover:bg-muted/50 ${
                !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                isTodayDate ? 'bg-coral text-white' : ''
              }`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    data-testid={`calendar-event-${event.id}`}
                    className="text-xs p-1 rounded bg-teal/20 text-navy dark:text-white truncate hover:bg-teal/30 cursor-pointer"
                  >
                    {format(new Date(event.startTime), "h:mm a")} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
