# Groupi Architecture Guide

This guide describes Groupi's cross-platform architecture, including package structure, data flow patterns, and best practices for feature development.

## Table of Contents

- [Overview](#overview)
- [Architecture Pattern](#architecture-pattern)
- [Package Structure](#package-structure)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Data Flow](#data-flow)
- [Real-Time Patterns](#real-time-patterns)
- [Feature Development](#feature-development)
- [Best Practices](#best-practices)

## Overview

Groupi uses a **modern cross-platform architecture** built around:

- **Client-Only Applications** (web and mobile) that share business logic
- **Real-time Backend** powered by Convex with automatic subscriptions
- **Better Auth Integration** for authentication via Convex component
- **Platform Abstraction** for seamless cross-platform development
- **Shared Business Logic** with platform-specific UI implementations

This architecture maximizes code reuse while maintaining platform-specific optimizations and user experiences.

## Architecture Pattern

### Core Principles

1. **Real-Time First**: All data operations are real-time by default via Convex subscriptions
2. **Cross-Platform by Design**: 95% of business logic is shared between web and mobile
3. **Client-Only**: No server-side rendering or API routes - pure client applications
4. **Platform Abstraction**: Navigation, storage, and UI feedback are abstracted
5. **Type Safety**: End-to-end TypeScript with auto-generated types from Convex

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Convex Backend                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Better Auth Component (manages users, sessions, etc.)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Queries    │  │ Mutations   │  │  Actions    │            │
│  │ (Real-time) │  │ (Atomic)    │  │ (External)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
         ┌─────────────────────┐   ┌─────────────────────┐
         │   @groupi/shared    │   │   @groupi/shared    │
         │                     │   │                     │
         │ ┌─────────────────┐ │   │ ┌─────────────────┐ │
         │ │ Business Logic  │ │   │ │ Business Logic  │ │
         │ │    Hooks        │ │   │ │    Hooks        │ │
         │ └─────────────────┘ │   │ └─────────────────┘ │
         │ ┌─────────────────┐ │   │ ┌─────────────────┐ │
         │ │ Platform        │ │   │ │ Platform        │ │
         │ │ Abstractions    │ │   │ │ Abstractions    │ │
         │ └─────────────────┘ │   │ └─────────────────┘ │
         └─────────────────────┘   └─────────────────────┘
                    │                       │
         ┌─────────────────────┐   ┌─────────────────────┐
         │    Web App          │   │   Mobile App        │
         │  (Next.js 16)       │   │ (React Native/Expo) │
         └─────────────────────┘   └─────────────────────┘
```

## Package Structure

### `/convex/` - Backend Functions

```
convex/
├── schema.ts              # Database schema definition
├── auth.ts                # Better Auth client and utilities
├── auth.config.ts         # Better Auth configuration
├── convex.config.ts       # Component registration (Better Auth, Presence)
├── http.ts                # HTTP endpoints (auth routes)
├── _generated/            # Auto-generated types (DO NOT EDIT)
├── accounts/              # User account management
│   ├── queries.ts
│   └── mutations.ts
├── admin/                 # Admin dashboard functions
│   ├── queries.ts
│   └── mutations.ts
├── availability/          # Event availability tracking
│   ├── queries.ts
│   └── mutations.ts
├── events/                # Event CRUD operations
│   ├── queries.ts
│   └── mutations.ts
├── invites/               # Event invite management
│   ├── queries.ts
│   └── mutations.ts
├── notifications/         # Notification system
│   ├── queries.ts
│   └── mutations.ts
├── posts/                 # Discussion posts
│   ├── queries.ts
│   └── mutations.ts
├── replies/               # Post replies
│   ├── queries.ts
│   └── mutations.ts
├── settings/              # User settings
│   ├── queries.ts
│   └── mutations.ts
├── users/                 # User profile operations
│   ├── queries.ts
│   └── mutations.ts
├── presence.ts            # Real-time presence tracking
├── lib/
│   └── notifications.ts   # Notification utilities
└── tests/                 # Backend tests
    └── *.test.ts
```

### `/packages/shared/` - Cross-Platform Business Logic

```
packages/shared/
├── src/
│   ├── hooks/
│   │   ├── index.ts           # Hook factory exports
│   │   ├── types.ts           # Convex API type definitions
│   │   ├── useAuth.ts         # Authentication hooks
│   │   ├── useEventData.ts    # Event data hooks
│   │   ├── useEventActions.ts # Event action hooks
│   │   ├── usePostData.ts     # Post data hooks
│   │   └── usePostActions.ts  # Post action hooks
│   ├── platform/
│   │   ├── index.ts           # Platform abstraction exports
│   │   ├── types.ts           # Platform adapter interfaces
│   │   ├── navigation.ts      # Navigation abstraction
│   │   ├── storage.ts         # Storage abstraction
│   │   └── toast.ts           # Toast/notification abstraction
│   ├── design/
│   │   ├── index.ts           # Design system exports
│   │   ├── tokens.ts          # Design tokens
│   │   └── utils.ts           # Design utilities
│   ├── types/
│   │   └── index.ts           # Shared type definitions
│   └── utils/
│       ├── index.ts           # Utility exports
│       ├── device.ts          # Device/layout utilities
│       ├── keyboard.ts        # Keyboard handling
│       └── accessibility.ts   # Accessibility helpers
└── package.json
```

### `/packages/web/` - Next.js Web Application

```
packages/web/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (event)/          # Event-related pages
│   │   ├── (post)/           # Post-related pages
│   │   └── layout.tsx        # Root layout with providers
│   ├── components/           # Web-specific UI components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Web-specific hooks
│   └── lib/                 # Web utilities
│       ├── convex.ts        # Convex client setup
│       └── platform.ts      # Web platform adapters
├── next.config.mjs
└── package.json
```

### `/packages/mobile/` - React Native Mobile Application

```
packages/mobile/
├── src/
│   ├── screens/              # Screen components
│   ├── components/           # Mobile-specific components
│   ├── lib/
│   │   └── platform-setup.ts # Mobile platform adapters
│   └── theme/                # Mobile theme configuration
├── app.json                  # Expo configuration
└── package.json
```

## Data Model

### Core Tables

Groupi uses Convex for data storage with the following key tables:

| Table            | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `persons`        | App-specific user data, links to Better Auth users |
| `events`         | Event planning core entity                         |
| `memberships`    | User participation in events (role, RSVP)          |
| `posts`          | Discussion posts within events                     |
| `replies`        | Responses to posts                                 |
| `invites`        | Event invite tokens                                |
| `notifications`  | User notifications                                 |
| `availabilities` | User availability for potential dates              |

### User Data Architecture

Users are managed by the **Better Auth Convex Component**, which stores authentication data in its own namespace. Our app schema has a `persons` table that links to component users:

```typescript
// Better Auth component manages: users, sessions, accounts, verifications
// Our schema has persons that reference component users:

persons: defineTable({
  userId: v.string(),  // Better Auth component user ID
  bio: v.optional(v.string()),
  pronouns: v.optional(v.string()),
  lastSeen: v.optional(v.number()),
}).index('by_user_id', ['userId']),
```

This separation allows Better Auth to manage authentication while we maintain app-specific user data.

## Authentication

### Better Auth Integration

Authentication uses the Better Auth Convex Component. Key patterns:

```typescript
// convex/auth.ts - Auth client and utilities
import { createClient } from '@convex-dev/better-auth';
import { components } from './_generated/api';

// Create the Better Auth client
export const authComponent = createClient<DataModel>(components.betterAuth);

// Type for Better Auth user IDs
export type AuthUserId = Parameters<typeof authComponent.getAnyUserById>[1];

// Extended user type with plugin fields (username, role, etc.)
export type ExtendedAuthUser = {
  _id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string | null;
};
```

### Getting Current User

```typescript
// In any query or mutation
import { getCurrentPerson, authComponent, AuthUserId } from '../auth';

export const myQuery = query({
  handler: async ctx => {
    // Get the current person (our app's user record)
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      throw new Error('Authentication required');
    }

    // If you need Better Auth user data (name, email, etc.)
    const user = await authComponent.getAnyUserById(
      ctx,
      currentPerson.userId as AuthUserId
    );

    return { person: currentPerson, user };
  },
});
```

### Looking Up Any User

```typescript
// Look up user by their Better Auth ID
const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);

// Cast to ExtendedAuthUser to access plugin fields
const extendedUser = user as ExtendedAuthUser;
console.log(extendedUser.username, extendedUser.role);
```

## Data Flow

### Query Pattern (Real-time Subscriptions)

Convex queries automatically subscribe to real-time updates. No manual cache management needed:

```typescript
// In shared hooks
export function createEventHooks(api: ConvexApi) {
  return {
    useEventData: (eventId: string) => {
      // This automatically subscribes to real-time updates
      // When data changes on the server, the component re-renders
      return useQuery(api.events.queries.getEvent, { eventId });
    },
  };
}

// In components - data updates automatically
const event = useEventData(eventId);
// When another user modifies this event, `event` updates automatically
```

### Mutation Pattern

```typescript
export function createEventActionHooks(api: ConvexApi) {
  return {
    useCreateEvent: () => {
      const mutation = useMutation(api.events.mutations.createEvent);

      return async (data: CreateEventInput) => {
        try {
          const result = await mutation(data);
          toast.success('Event created successfully!');
          navigation.push(`/event/${result}`);
          return { success: true, data: result };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'An error occurred';
          toast.error(`Failed to create event: ${message}`);
          return { success: false, error: message };
        }
      };
    },
  };
}
```

### Platform Abstraction Pattern

```typescript
// Platform-agnostic code in shared package
import { navigation, storage, toast } from '@groupi/shared/platform';

function handleEventCreation() {
  // This works identically on web and mobile
  navigation.push('/events/new');
  storage.setItem('lastRoute', '/events/new');
  toast.success('Navigating to create event...');
}

// Platform-specific implementations provided at runtime:
// Web: Next.js router, localStorage, Sonner
// Mobile: React Navigation, Expo SecureStore, React Native Toast
```

## Real-Time Patterns

### Automatic Subscriptions

Convex handles real-time sync automatically. When you use `useQuery`:

1. **Initial load**: Data fetched from server
2. **Subscription**: Client subscribes to changes
3. **Updates**: When data changes (from any client), your component re-renders
4. **No manual cache**: No need for React Query, SWR, or cache invalidation

```typescript
// This is all you need for real-time data
const posts = useQuery(api.posts.queries.getPostsByEvent, { eventId });

// When any user creates/updates/deletes a post, this updates automatically
```

### Presence Tracking

For features like "who's online" or "typing indicators", use the Presence component:

```typescript
// convex/presence.ts
import { Presence } from '@convex-dev/presence';

export const presence = new Presence(components.presence);

// Heartbeat to indicate user is present
export const heartbeat = mutation({
  args: { roomId: v.string(), userId: v.string(), ... },
  handler: async (ctx, args) => {
    return await presence.heartbeat(ctx, args.roomId, args.userId, ...);
  },
});

// List users in a room
export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});
```

### Typing Indicators

```typescript
// Update presence data with typing status
export const updatePresenceData = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    data: v.optional(
      v.object({
        isTyping: v.optional(v.boolean()),
        lastActivity: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { roomId, userId, data }) => {
    return await presence.updateRoomUser(ctx, roomId, userId, data);
  },
});
```

## Feature Development

### Adding a New Feature

For every new feature, follow this order:

#### Step 1: Backend Schema and Functions

```typescript
// 1. Add to convex/schema.ts
comments: defineTable({
  content: v.string(),
  authorId: v.id("persons"),
  postId: v.id("posts"),
})
  .index("by_post", ["postId"])
  .index("by_author", ["authorId"]),

// 2. Create convex/comments/queries.ts
export const getCommentsByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("desc")
      .collect();
  },
});

// 3. Create convex/comments/mutations.ts
export const createComment = mutation({
  args: { content: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const person = await getCurrentPerson(ctx);
    if (!person) throw new Error("Not authenticated");

    return await ctx.db.insert("comments", {
      ...args,
      authorId: person._id,
    });
  },
});
```

#### Step 2: Shared Business Logic

```typescript
// packages/shared/src/hooks/useCommentData.ts
export function createCommentHooks(api: ConvexApi) {
  function useCommentsByPost(postId: string) {
    return useQuery(api.comments.queries.getCommentsByPost, { postId });
  }

  function useCreateComment() {
    const mutation = useMutation(api.comments.mutations.createComment);

    return async (data: { content: string; postId: string }) => {
      try {
        const result = await mutation(data);
        toast.success('Comment posted!');
        return { success: true, data: result };
      } catch (error) {
        toast.error('Failed to post comment');
        return { success: false, error };
      }
    };
  }

  return { useCommentsByPost, useCreateComment };
}
```

#### Step 3: Platform UI

```typescript
// Web component
export function CommentList({ postId }: { postId: string }) {
  const { useCommentsByPost } = createCommentHooks(api);
  const comments = useCommentsByPost(postId);

  if (!comments) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment._id} comment={comment} />
      ))}
    </div>
  );
}
```

### Feature Development Checklist

1. **Backend First**:
   - [ ] Define schema in `convex/schema.ts`
   - [ ] Create queries in `convex/{domain}/queries.ts`
   - [ ] Create mutations in `convex/{domain}/mutations.ts`
   - [ ] Add proper indexes for query performance

2. **Shared Business Logic**:
   - [ ] Create hooks in `packages/shared/src/hooks/`
   - [ ] Export from `packages/shared/src/hooks/index.ts`
   - [ ] Add error handling with platform toast abstraction

3. **Platform UI**:
   - [ ] Implement web components using shared hooks
   - [ ] Implement mobile components using same hooks
   - [ ] Handle loading and error states

## Best Practices

### Data Layer (Convex)

**DO:**

```typescript
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Always check auth
    const person = await getCurrentPerson(ctx);
    if (!person) throw new Error('Not authenticated');

    // Validate inputs
    if (args.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }

    return await ctx.db.insert('events', {
      ...args,
      creatorId: person._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

**DON'T:**

```typescript
export const createEvent = mutation({
  args: { data: v.any() }, // ❌ No validation
  handler: async (ctx, { data }) => {
    // ❌ No auth check
    return await ctx.db.insert('events', data);
  },
});
```

### Shared Business Logic

**DO:**

```typescript
// Use factory pattern for dependency injection
export function createEventHooks(api: ConvexApi) {
  function useCreateEvent() {
    const mutation = useMutation(api.events.mutations.createEvent);

    return async (data: CreateEventInput) => {
      try {
        const result = await mutation(data);
        toast.success('Event created!');
        navigation.push(`/event/${result}`);
        return { success: true, data: result };
      } catch (error) {
        toast.error('Failed to create event');
        return { success: false, error };
      }
    };
  }

  return { useCreateEvent };
}
```

**DON'T:**

```typescript
// ❌ Don't import platform-specific modules
import { useRouter } from 'next/navigation'; // Web-only!
import { toast } from 'sonner'; // Web-only!

export function useCreateEvent() {
  const router = useRouter(); // Won't work on mobile
  // ...
}
```

### Component Architecture

**DO:**

```typescript
// Separate data fetching from UI
function EventPage({ eventId }: { eventId: string }) {
  const event = useEventData(eventId);

  if (!event) return <LoadingSpinner />;
  return <EventUI event={event} />;
}

// Pure UI component
function EventUI({ event }: { event: Event }) {
  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
    </div>
  );
}
```

**DON'T:**

```typescript
// ❌ Don't use manual state for server data
function EventPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchEvent(eventId).then(setEvent); // ❌ Manual fetching
  }, [eventId]);

  // ...
}
```

### Error Handling

Always handle errors in mutation hooks and provide user feedback:

```typescript
return async (data: Input) => {
  try {
    const result = await mutation(data);
    toast.success('Success!');
    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An error occurred';
    toast.error(message);
    return { success: false, error: message };
  }
};
```
