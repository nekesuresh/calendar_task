import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import type { Event, InsertEvent, Organizer } from "@shared/schema";
import { Header } from "@/components/header";
import { CalendarView } from "@/components/calendar-view";
import { MonthCalendar } from "@/components/month-calendar";
import { EventFormModal } from "@/components/event-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CalendarSkeleton } from "@/components/loading-skeletons";
import { EmptyState } from "@/components/empty-state";

export default function CalendarPage() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const isNavigated = sessionStorage.getItem("navigatedToCalendar");
    if (!isNavigated) {
      navigate("/");
    }
    sessionStorage.removeItem("navigatedToCalendar");
  }, [navigate]);
  const [activeView, setActiveView] = useState<"events" | "calendar">("events");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  const { data: organizer } = useQuery<Organizer>({
    queryKey: ["/api/organizer"],
    queryFn: async () => {
      const response = await fetch("/api/organizer");
      if (!response.ok) {
        throw new Error("Failed to fetch organizer");
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast.success("Session created successfully!");
      setIsFormOpen(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertEvent }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast.success("Session updated successfully!");
      setIsFormOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete event");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast.success("Session deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSession = () => {
    setSelectedEvent(null);
    setSelectedDate(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: InsertEvent) => {
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCreateSession={handleCreateSession}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        {eventsLoading ? (
          <CalendarSkeleton />
        ) : activeView === "events" ? (
          events.length === 0 ? (
            <EmptyState onCreateSession={handleCreateSession} />
          ) : (
            <CalendarView
              events={events}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              currentDate={new Date()}
            />
          )
        ) : (
          <MonthCalendar
            events={events}
            onEventClick={handleEditEvent}
            onDateClick={handleDateClick}
          />
        )}
      </main>

      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        onSubmit={handleFormSubmit}
        event={selectedEvent}
        isLoading={createMutation.isPending || updateMutation.isPending}
        organizerEmail={organizer?.email}
        selectedDate={selectedDate}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleConfirmDelete}
        event={selectedEvent}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
