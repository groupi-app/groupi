# @groupi/web

The Next.js web application for Groupi, providing the user interface for event planning and group coordination.

## Overview

This is the main web application built with Next.js 16 App Router. It's a **client-only** application that uses Convex for real-time data synchronization and Better Auth for authentication.

## Architecture

### Application Structure

```
packages/web/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main application routes
│   └── ...
├── components/             # React components
│   ├── atoms/             # Smallest UI elements
│   ├── molecules/         # Simple component combinations
│   ├── organisms/         # Complex feature components
│   ├── templates/         # Page layout templates
│   ├── ui/                # shadcn/ui base components
│   └── providers/         # React context providers
├── hooks/                  # Custom React hooks
│   └── convex/            # Convex-specific hooks
├── lib/                    # Utility functions and setup
├── stores/                 # Zustand state stores
└── context/               # React contexts
```

### Key Principles

1. **Client-Only**: No SSR, no API routes, no server actions
2. **Real-Time First**: All data via Convex subscriptions (`useQuery`/`useMutation`)
3. **Cross-Platform**: Uses shared hooks from `@groupi/shared`
4. **Type-Safe**: Full TypeScript with Convex type inference

### Data Flow

```
User Interaction
    ↓
React Component (packages/web)
    ↓
Convex Hook (useQuery/useMutation)
    ↓
Convex Backend (convex/)
    ↓
Real-time sync back to UI
```

## Development

### Running Locally

```bash
# From root directory
pnpm dev

# Or specifically
pnpm --filter @groupi/web dev
```

The app runs on http://localhost:3000

### Validation

```bash
pnpm check              # Lint + type-check + format
pnpm test:web           # Run web tests
pnpm lint:tokens        # Check design token usage
```

### Environment Variables

Required environment variables are defined in the root `.env.example`. Copy to `.env.local` and fill in your values.

## Key Features

### Real-Time Data

All data operations use Convex for automatic real-time synchronization:

```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Data automatically updates when it changes
const events = useQuery(api.events.queries.list);

// Mutations with optimistic updates
const createEvent = useMutation(api.events.mutations.create);
```

### Authentication

Authentication is handled by Better Auth with Convex integration:

- OAuth providers (Google, Discord)
- Email/password authentication
- Session management
- Protected routes

### Design System

Uses a Duolingo-inspired design with semantic tokens:

- **Atoms**: StatusDot, PresenceIndicator
- **Molecules**: UserInfoCard, RsvpStatus
- **Organisms**: PostCard, MemberIcon
- **Templates**: DetailPageTemplate, ListPageTemplate

See the [UI Design System documentation](../../docs/ui-design-system.md) for details.

### Presence System

Real-time presence tracking for users:

- Online/offline status
- Typing indicators
- Room-based presence (who's viewing what)

## Component Patterns

### Using Convex Hooks

```typescript
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function EventList() {
  const events = useQuery(api.events.queries.list);

  if (events === undefined) {
    return <LoadingSkeleton />;
  }

  return (
    <ul>
      {events.map(event => (
        <EventCard key={event._id} event={event} />
      ))}
    </ul>
  );
}
```

### Using Shared Hooks

```typescript
import { useGlobalUser } from '@/context/global-user-context';

export function ProfileSection() {
  const { person, isLoading } = useGlobalUser();

  if (isLoading) return <LoadingSkeleton />;
  if (!person) return <SignInPrompt />;

  return <ProfileCard person={person} />;
}
```

## Provider Architecture

The app uses a provider hierarchy in `components/providers/`:

- `ConvexClientProvider` - Convex connection and auth
- `ThemeProvider` - Dark/light mode
- `GlobalUserProvider` - Current user context
- `VisibilityProvider` - Tab visibility tracking

## Related Documentation

- [Architecture Rules](../../.claude/rules/architecture.md)
- [UI Design System](../../.claude/rules/ui-design-system.md)
- [Presence System](../../.claude/rules/presence.md)
- [Testing Guide](../../.claude/rules/testing.md)
