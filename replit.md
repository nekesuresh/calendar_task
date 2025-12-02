# Tutoring Sessions Calendar App

## Overview

This is a modern tutoring calendar application that integrates with Google Calendar and Google Drive to provide full CRUD operations for tutoring sessions. The application features a dual-view interface (list view and monthly calendar view) with automatic Google Meet link generation for virtual sessions. Additionally, it supports viewing Google Meet recordings for past sessions. Built with React, TypeScript, and Express, it provides a user-friendly interface for scheduling, managing, and tracking educational sessions.

## Recent Changes (December 2, 2025)
- Added Google Drive integration for fetching Meet recordings
- Added recording status indicators on past events (locked/processing/available states)
- Fixed calendar account switching - users can now connect to different Google accounts
- Fixed page refresh behavior - /calendar page redirects to landing page on refresh

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript as the UI framework
- Vite for development server and production bundling
- Wouter for lightweight client-side routing (alternative to React Router)

**UI Component System**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS with custom HSL color system for styling
- Custom color palette: Teal (#6DB8D0), Yellow (#FBC85F), Navy (#3E4E88), Coral (#F87C73)
- Supports dark mode through theme provider with localStorage persistence
- DM Sans for primary typography, Fira Code for monospace text

**State Management**
- TanStack React Query v5 for server state management and caching
- No global client state management (relies on React Query for server data)
- React Hook Form with Zod validation for form handling

**Routing Structure**
- `/` - Landing page with feature highlights
- `/calendar` - Main calendar interface with events list and calendar views
- Catches 404s with NotFound component

**Key Components**
- `CalendarView`: List-based view showing upcoming and completed sessions
- `MonthCalendar`: Traditional calendar grid view with event indicators
- `EventFormModal`: Form dialog for creating/editing sessions
- `DeleteConfirmDialog`: Confirmation dialog for session deletion
- `EventCard`: Individual session card with actions and session details

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Native Node.js HTTP server
- Development mode uses Vite middleware for HMR
- Production mode serves static files from dist/public

**API Endpoints**
- `GET /api/organizer` - Retrieves primary calendar organizer information
- `GET /api/events` - Lists all events (past 30 days to future 365 days)
- `POST /api/events` - Creates new event with automatic Google Meet link
- `PATCH /api/events/:id` - Updates existing event
- `DELETE /api/events/:id` - Deletes event from Google Calendar

**Request/Response Flow**
- All API requests use JSON format
- Zod schemas validate incoming data on both client and server
- Express middleware logs requests with timing information
- Error responses include descriptive messages

### Data Storage & Schemas

**Primary Data Source**
- Google Calendar serves as the single source of truth for event data
- No local database storage for events (Drizzle ORM configured but unused for events)
- Events are fetched, created, updated, and deleted directly via Google Calendar API

**Schema Validation**
- Shared Zod schemas between client and server (`shared/schema.ts`)
- `eventSchema` - Validates complete event objects with ID
- `insertEventSchema` - Validates event creation/update payloads with time validation
- `organizerSchema` - Validates organizer information

**Event Data Model**
```typescript
{
  id: string
  title: string (1-100 chars)
  startTime: string (ISO 8601)
  endTime: string (ISO 8601)
  timezone: string (IANA timezone)
  participants: string[] (emails, max 6)
  meetLink?: string (Google Meet URL)
  description?: string
}
```

### Authentication & Authorization

**OAuth Flow**
- Uses Replit Connector system for OAuth management
- Authenticates with Google Calendar API using OAuth 2.0
- Access tokens retrieved via Replit's connector API
- Tokens automatically refreshed when expired
- No manual OAuth implementation - delegated to Replit infrastructure

**Security Considerations**
- Never caches Google Calendar client (creates fresh client per request)
- Access tokens expire and are refreshed automatically
- Uses Replit identity tokens (REPL_IDENTITY or WEB_REPL_RENEWAL)
- Connector hostname from environment variables

## External Dependencies

### Third-Party Services

**Google Calendar API**
- Purpose: Primary data source for calendar events
- Integration: googleapis npm package
- Authentication: OAuth 2.0 via Replit Connector
- Auto-generates Google Meet links for conferences
- Handles event CRUD operations

**Replit Connector**
- Purpose: OAuth credential management
- Handles token refresh and expiration
- Provides secure credential storage
- Accessed via `REPLIT_CONNECTORS_HOSTNAME` environment variable

### Database Configuration

**PostgreSQL with Drizzle ORM**
- Configured but not actively used for event storage
- Database schema defined in `shared/schema.ts`
- Drizzle config points to `DATABASE_URL` environment variable
- Migration directory: `./migrations`
- Could be used for additional features (user preferences, metadata, etc.)

### Key NPM Dependencies

**Core Framework**
- `express` - Web server framework
- `react` & `react-dom` - UI library
- `vite` - Build tool and dev server
- `typescript` - Type safety
- `drizzle-orm` - ORM (configured, not actively used)

**Google Integration**
- `googleapis` - Google Calendar API client
- `@neondatabase/serverless` - Database driver

**UI & Styling**
- `@radix-ui/*` - Headless UI primitives (30+ packages)
- `tailwindcss` - Utility-first CSS
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library

**Data Management**
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zod` - Runtime validation
- `date-fns` - Date manipulation

**Routing & Navigation**
- `wouter` - Lightweight routing

**Development Tools**
- `@replit/vite-plugin-runtime-error-modal` - Error overlay
- `@replit/vite-plugin-cartographer` - Replit integration
- `esbuild` - Server bundling for production