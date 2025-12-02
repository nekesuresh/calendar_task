import { format } from "date-fns";
import { Calendar, Clock, Users, Video, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const subjectColors: Record<string, string> = {
  "Math": "bg-teal/20 text-teal border-teal/30",
  "Science": "bg-secondary/20 text-secondary border-secondary/30",
  "English": "bg-yellow/20 text-navy border-yellow/30",
  "History": "bg-coral/20 text-coral border-coral/30",
  "": "bg-muted text-muted-foreground border-muted"
};

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isPast = endDate < new Date();

  const subjectColor = event.subject 
    ? (subjectColors[event.subject] || "bg-muted text-muted-foreground border-muted")
    : "";

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border-2 bg-card p-5 shadow-md transition-all hover:shadow-lg ${
        isPast ? 'opacity-70' : ''
      }`}
      data-testid={`card-event-${event.id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        event.subject === 'Math' ? 'bg-teal' :
        event.subject === 'Science' ? 'bg-secondary' :
        event.subject === 'English' ? 'bg-yellow' :
        event.subject === 'History' ? 'bg-coral' :
        'bg-muted'
      }`} />
      
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {event.subject && (
              <Badge 
                variant="outline" 
                className={`rounded-full font-medium ${subjectColor}`}
                data-testid={`badge-subject-${event.id}`}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                {event.subject}
              </Badge>
            )}
          </div>
          
          <h3 
            className="text-lg font-bold text-navy dark:text-white mb-3 truncate"
            data-testid={`text-title-${event.id}`}
          >
            {event.title}
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span data-testid={`text-date-${event.id}`}>
                {format(startDate, "MMMM d, yyyy")}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span data-testid={`text-time-${event.id}`}>
                {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
              </span>
              <Badge 
                variant="secondary" 
                className="rounded-full text-xs ml-1"
                data-testid={`badge-timezone-${event.id}`}
              >
                {event.timezone}
              </Badge>
            </div>

            {event.participants.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {event.participants.map((email, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="rounded-full text-xs"
                      data-testid={`badge-participant-${event.id}-${idx}`}
                    >
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${event.id}`}>
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(event)}
            data-testid={`button-edit-${event.id}`}
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(event)}
            data-testid={`button-delete-${event.id}`}
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {event.meetLink && (
        <div className="mt-4 pl-2">
          <Button
            asChild
            className="w-full rounded-full bg-coral hover:bg-coral/90 text-white font-medium shadow-sm"
            data-testid={`button-join-${event.id}`}
          >
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Join Session
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
