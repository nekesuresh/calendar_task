# Tutoring Sessions Calendar App

## Overview

This is a modern tutoring calendar application that integrates with Google Calendar to provide full CRUD operations for tutoring sessions. The application features a dual-view interface (list view and monthly calendar view) with automatic Zoom meeting link generation for virtual sessions. Built with React, TypeScript, and Express, it provides a user-friendly interface for scheduling, managing, and tracking educational sessions with cloud recording access.

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
- `EventCard`: Individual session card with Join/Recording buttons and session details

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Native Node.js HTTP server
- Development mode uses Vite middleware for HMR
- Production mode serves static files from dist/public

**API Endpoints**
- `GET /api/organizer` - Retrieves primary calendar organizer information
- `GET /api/events` - Lists all events with Zoom recording status (past 30 days to future 365 days)
- `POST /api/events` - Creates new event with automatic Zoom meeting link
- `PATCH /api/events/:id` - Updates existing event
- `DELETE /api/events/:id` - Deletes event from Google Calendar and Zoom

**Request/Response Flow**
- All API requests use JSON format
- Zod schemas validate incoming data on both client and server
- Express middleware logs requests with timing information
- Error responses include descriptive user-friendly messages

### Data Storage & Schemas

**Primary Data Source**
- Google Calendar serves as the single source of truth for event data
- Zoom meeting IDs stored in Google Calendar event description
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
  meetLink?: string (Zoom meeting URL)
  description?: string
  recordingLink?: string (Zoom recording share URL)
  recordingPassword?: string (Zoom recording password)
  recordingError?: string (user-friendly error message if recording unavailable)
}
```

### Authentication & Authorization

**Google Calendar OAuth Flow**
- Uses Replit Connector system for OAuth management
- Authenticates with Google Calendar API using OAuth 2.0
- Access tokens retrieved via Replit's connector API
- Tokens automatically refreshed when expired

**Zoom Server-to-Server OAuth**
- Uses Server-to-Server OAuth (not user OAuth)
- Credentials stored in Replit Secrets: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
- Token cached with automatic invalidation on 401 errors
- Automatic retry on authentication failures
- Required scopes: meeting:write:admin, recording:read:admin, recording:write:admin

**Security Considerations**
- Never caches Google Calendar client (creates fresh client per request)
- Zoom tokens cached but invalidated automatically on auth failures
- Access tokens expire and are refreshed automatically
- Uses Replit identity tokens (REPL_IDENTITY or WEB_REPL_RENEWAL)

## External Dependencies

### Third-Party Services

**Google Calendar API**
- Purpose: Primary data source for calendar events
- Integration: googleapis npm package
- Authentication: OAuth 2.0 via Replit Connector
- Handles event CRUD operations
- Stores Zoom meeting IDs in event description

**Zoom API**
- Purpose: Video conferencing and cloud recording
- Authentication: Server-to-Server OAuth with token caching
- Features:
  - Automatic meeting creation with join links
  - Cloud recording access with public sharing
  - Recording password display
  - Automatic meeting deletion on event delete
- Error Handling:
  - 401: Token refresh and retry
  - 429: Rate limit with user-friendly message
  - 403/400: Zoom Pro requirement messaging
  - 404: No recording available (silent)
  - 5xx: Service error messaging

**Replit Connector**
- Purpose: Google Calendar OAuth credential management
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

**API Integrations**
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

## Zoom Integration Details

### Meeting Creation Flow
1. User creates event in calendar
2. Backend calls Zoom API to create meeting
3. Meeting join URL returned and stored
4. Zoom meeting ID stored in Google Calendar event description

### Recording Access Flow
1. After meeting ends, Zoom processes recording
2. GET /api/events fetches recording status for past events
3. If recording exists but not publicly shared, API enables public sharing
4. Share URL and password returned to frontend
5. User can click "Recording" button to access

### Error Handling
- All Zoom API calls go through centralized `zoomApiCall` wrapper
- 401 errors trigger token cache invalidation and automatic retry
- User-friendly error messages displayed for:
  - Rate limits (429)
  - Authentication failures (401)
  - Permission/Pro account requirements (403/400)
  - Service errors (5xx)
