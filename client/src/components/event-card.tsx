import { format } from "date-fns";
import { Calendar, Clock, Users, Video, Pencil, Trash2, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isPast = endDate < new Date();

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border-2 bg-card p-5 shadow-md transition-all hover:shadow-lg ${
        isPast ? 'opacity-70' : ''
      }`}
      data-testid={`card-event-${event.id}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal" />
      
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="flex-1 min-w-0">
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

      <div className="mt-4 pl-2 flex flex-col sm:flex-row gap-2">
        {event.meetLink && !isPast && (
          <Button
            asChild
            className="w-full sm:flex-1 rounded-full bg-coral hover:bg-coral/90 text-white font-medium shadow-sm"
            data-testid={`button-join-${event.id}`}
          >
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Join Session
            </a>
          </Button>
        )}

        {event.meetLink && (
          <>
            {event.recordingStatus === 'available' && event.recordingUrl ? (
              <Button
                asChild
                className="w-full sm:flex-1 rounded-full bg-teal hover:bg-teal/90 text-white font-medium shadow-sm"
                data-testid={`button-view-recording-${event.id}`}
              >
                <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="h-4 w-4 mr-2" />
                  View Recording
                </a>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="w-full sm:flex-1 rounded-full bg-muted text-muted-foreground font-medium shadow-sm cursor-not-allowed"
                    data-testid={`button-recording-locked-${event.id}`}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    View Recording
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>No recording available yet.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
