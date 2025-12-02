import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2 } from "lucide-react";
import { insertEventSchema, type InsertEvent, type Event } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertEvent) => void;
  event?: Event | null;
  isLoading?: boolean;
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

const SUBJECTS = ["Math", "Science", "English", "History", "Other"];

export function EventFormModal({ isOpen, onClose, onSubmit, event, isLoading }: EventFormModalProps) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const selectedSubject = watch("subject");
  const selectedTimezone = watch("timezone");

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        subject: event.subject || undefined,
        startTime: event.startTime.slice(0, 16),
        endTime: event.endTime.slice(0, 16),
        timezone: event.timezone,
        description: event.description || undefined,
        participants: event.participants,
      });
      setParticipants(event.participants);
    } else {
      reset({
        title: "",
        subject: undefined,
        startTime: "",
        endTime: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        description: "",
        participants: [],
      });
      setParticipants([]);
    }
  }, [event, reset]);

  const handleAddParticipant = () => {
    if (newParticipant && participants.length < 6) {
      const updatedParticipants = [...participants, newParticipant];
      setParticipants(updatedParticipants);
      setValue("participants", updatedParticipants);
      setNewParticipant("");
    }
  };

  const handleRemoveParticipant = (index: number) => {
    const updatedParticipants = participants.filter((_, i) => i !== index);
    setParticipants(updatedParticipants);
    setValue("participants", updatedParticipants);
  };

  const handleFormSubmit = (data: InsertEvent) => {
    onSubmit({
      ...data,
      participants,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-navy dark:text-white" data-testid="text-modal-title">
            {event ? "Edit Session" : "New Tutoring Session"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Session Title *
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Algebra Review Session"
              data-testid="input-title"
              className="rounded-xl"
            />
            {errors.title && (
              <p className="text-sm text-destructive" data-testid="error-title">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-semibold">
              Subject
            </Label>
            <Select value={selectedSubject || ""} onValueChange={(value) => setValue("subject", value)}>
              <SelectTrigger data-testid="select-subject" className="rounded-xl">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-semibold">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                data-testid="input-start-time"
                className="rounded-xl"
              />
              {errors.startTime && (
                <p className="text-sm text-destructive" data-testid="error-start-time">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-semibold">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register("endTime")}
                data-testid="input-end-time"
                className="rounded-xl"
              />
              {errors.endTime && (
                <p className="text-sm text-destructive" data-testid="error-end-time">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-semibold">
              Timezone *
            </Label>
            <Select value={selectedTimezone} onValueChange={(value) => setValue("timezone", value)}>
              <SelectTrigger data-testid="select-timezone" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Participants (Students/Tutors) - Max 6
            </Label>
            <div className="flex gap-2">
              <Input
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
                placeholder="Enter email address"
                type="email"
                data-testid="input-participant"
                className="rounded-xl"
                disabled={participants.length >= 6}
              />
              <Button
                type="button"
                onClick={handleAddParticipant}
                disabled={!newParticipant || participants.length >= 6}
                data-testid="button-add-participant"
                className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {participants.map((email, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="rounded-full pl-3 pr-1 py-1"
                    data-testid={`badge-participant-${idx}`}
                  >
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="h-5 w-5 ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                      data-testid={`button-remove-participant-${idx}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {errors.participants && (
              <p className="text-sm text-destructive" data-testid="error-participants">{errors.participants.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Notes / Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Add any notes or topics to cover..."
              rows={4}
              data-testid="input-description"
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit"
              className="rounded-full bg-coral hover:bg-coral/90 text-white"
            >
              {isLoading ? "Saving..." : event ? "Update Session" : "Create Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
