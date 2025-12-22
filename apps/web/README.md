# @groupi/web

The Next.js web application for Groupi, providing the user interface and orchestrating all application layers.

## Overview

This is the main web application built with Next.js 16 App Router. It serves as the entry point for users and coordinates between the schema, services, and UI packages to deliver a complete event planning and group coordination experience.

## Architecture

### Application Structure

```
apps/web/
├── app/                    # Next.js App Router pages and layouts
│   ├── (post)/            # Post-related routes
│   ├── (auth)/            # Authentication routes
│   └── ...
├── actions/                # Server actions (legacy, migrating to tRPC)
├── components/             # React components
│   └── providers/         # React context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and client setup
├── stores/                 # Zustand state stores
└── types/                  # TypeScript types
```

### Key Responsibilities

1. **Routing**: Handles all application routes using Next.js App Router
2. **Server Actions**: Provides server-side actions for data mutations (legacy pattern)
3. **UI Components**: Renders user interface using shared UI components
4. **Real-time**: Integrates Pusher for real-time updates
5. **Authentication**: Manages user authentication via Better Auth
6. **State Management**: Uses TanStack Query for server state, Zustand for client state

### Data Flow

```
User Interaction
    ↓
React Component (apps/web)
    ↓
Server Action / tRPC Hook (apps/web)
    ↓
Service Layer (@groupi/services)
    ↓
Schema Validation (@groupi/schema)
    ↓
Database (Prisma)
```

### Integration Points

- **@groupi/schema**: Imports types, DTOs, and validation schemas
- **@groupi/services**: Uses service functions for business logic
- **@groupi/ui**: Uses shared UI components and utilities

## Development

### Running Locally

```bash
# From root directory
pnpm dev

# Or specifically
pnpm dev --filter=@groupi/web
```

The app runs on http://localhost:3000

### Building

```bash
pnpm build --filter=@groupi/web
```

### Environment Variables

Required environment variables are defined in `env.mjs`. See root `.env.example` for all required variables.

## Key Features

### Server Components

The app uses Next.js Server Components by default, with Client Components (`'use client'`) only where needed for interactivity.

### Real-time Updates

Real-time functionality is provided via Pusher:
- Push notifications (Pusher Beams)
- Channel subscriptions for live updates
- Automatic cache invalidation via TanStack Query

### Authentication

Authentication is handled by Better Auth with:
- Session management
- Protected routes
- Server-side auth checks

### Error Handling

- Sentry integration for error tracking
- Effect-based error handling in services
- User-friendly error boundaries

## Provider Architecture

The app uses a provider hierarchy in `components/providers/`:
- `ThemeProvider` - Dark/light mode
- `TooltipProvider` - Radix UI tooltips
- `PusherBeamsProvider` - Push notifications
- `NotificationCloseContextProvider` - Notification UI state

See `components/providers/README.md` for details.

## Migration Notes

The application is in transition:
- **Legacy**: Server actions in `actions/` directory
- **Future**: tRPC procedures (planned migration)
- **Current**: Mix of both patterns

