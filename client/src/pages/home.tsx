import { Link } from "wouter";
import { Calendar, Video, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              size="lg"
              data-testid="button-get-started"
              className="rounded-full bg-coral hover:bg-coral/90 text-white shadow-lg font-semibold text-lg px-8"
            >
              <Link href="/calendar">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
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
