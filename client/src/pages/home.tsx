import { useLocation } from "wouter";
import { Calendar, Video, Users, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Home() {
  const [, navigate] = useLocation();
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  useEffect(() => {
    const logoutFlag = sessionStorage.getItem("justLoggedOut");
    if (logoutFlag) {
      setJustLoggedOut(true);
      sessionStorage.removeItem("justLoggedOut");
    }
  }, []);

  const handleGetStarted = () => {
    sessionStorage.setItem("navigatedToCalendar", "true");
    navigate("/calendar");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-teal to-secondary shadow-xl mb-4">
            <Calendar className="h-20 w-20 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-navy dark:text-white leading-tight" data-testid="text-hero-title">
            Tutoring Sessions
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
            Modern calendar app for scheduling and managing educational sessions with Google Calendar integration.
          </p>

          {justLoggedOut && (
            <div className="max-w-2xl mx-auto p-4 rounded-xl bg-yellow/20 border border-yellow text-left">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-navy flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-navy dark:text-white mb-2">To switch Google accounts:</p>
                  <ol className="text-sm text-navy dark:text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Go to your Replit project settings</li>
                    <li>Find "Integrations" or "Google Calendar" connector</li>
                    <li>Click "Disconnect" to remove the current account</li>
                    <li>Click "Get Started" below to connect a different account</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleGetStarted}
              size="lg"
              data-testid="button-get-started"
              className="rounded-full bg-coral hover:bg-coral/90 text-white shadow-lg font-semibold text-lg px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 rounded-2xl bg-card border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 rounded-xl bg-teal/20 mb-4">
                <Video className="h-6 w-6 text-teal" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-navy dark:text-white">Auto Meet Links</h3>
              <p className="text-muted-foreground text-sm">
                Automatically generates Google Meet links for every session
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 rounded-xl bg-yellow/20 mb-4">
                <Users className="h-6 w-6 text-navy" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-navy dark:text-white">Student Management</h3>
              <p className="text-muted-foreground text-sm">
                Invite students and tutors with automatic email notifications
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 rounded-xl bg-coral/20 mb-4">
                <Clock className="h-6 w-6 text-coral" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-navy dark:text-white">Timezone Support</h3>
              <p className="text-muted-foreground text-sm">
                Full timezone support for coordinating across different regions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
