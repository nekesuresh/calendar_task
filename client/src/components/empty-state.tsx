import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateSession: () => void;
}

export function EmptyState({ onCreateSession }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="rounded-full bg-gradient-to-br from-teal/20 to-yellow/20 p-6 mb-6">
        <Calendar className="h-16 w-16 text-teal" />
      </div>
      <h3 className="text-2xl font-bold mb-2 text-navy dark:text-white" data-testid="text-empty-title">
        No sessions scheduled
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-empty-description">
        Get started by creating your first tutoring session. Add students, set the time, and we'll generate a Google Meet link automatically.
      </p>
      <Button
        onClick={onCreateSession}
        data-testid="button-empty-create"
        className="rounded-full bg-coral hover:bg-coral/90 text-white shadow-md font-medium"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Create Your First Session
      </Button>
    </div>
  );
}
