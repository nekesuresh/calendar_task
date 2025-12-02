import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Plus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCreateSession: () => void;
  activeView: "events" | "calendar";
  onViewChange: (view: "events" | "calendar") => void;
  organizerEmail?: string;
}

export function Header({ onCreateSession, activeView, onViewChange, organizerEmail }: HeaderProps) {
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-secondary shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-navy dark:text-white" data-testid="text-app-title">
              Tutoring Sessions
            </h1>
          </div>
          
          <div className="ml-6 hidden sm:flex items-center gap-2 rounded-full bg-muted p-1">
            <button
              onClick={() => onViewChange("events")}
              data-testid="button-view-events"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeView === "events"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => onViewChange("calendar")}
              data-testid="button-view-calendar"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeView === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={onCreateSession}
            data-testid="button-create-session"
            className="rounded-full bg-coral hover:bg-coral/90 text-white shadow-md font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
          {organizerEmail && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  data-testid="button-user-menu"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {organizerEmail}
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  data-testid="button-logout"
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <div className="sm:hidden border-t px-4 py-2">
        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          <button
            onClick={() => onViewChange("events")}
            data-testid="button-view-events-mobile"
            className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeView === "events"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => onViewChange("calendar")}
            data-testid="button-view-calendar-mobile"
            className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeView === "calendar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>
    </header>
  );
}
