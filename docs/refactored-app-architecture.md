# Groupi App Architecture - Refactored Data Fetching Pattern

## Overview

This document describes the refactored architecture for Groupi, a real-time event planning application. The architecture follows a consistent pattern for data fetching, error handling, and real-time synchronization across all pages.

## Architecture Layers

### 1. Schema Layer (`packages/schema`)

The schema layer defines all data structures and validation rules using Zod schemas:

- **Generated Schemas**: Prisma-generated Zod schemas for database models
- **DTO Schemas**: Data Transfer Object schemas for API responses
- **Page-Specific Schemas**: Tailored schemas for each page's data requirements
- **Error Schemas**: Discriminated unions for type-safe error handling
- **ResultTuple**: A consistent pattern for returning `[error, data]` tuples

#### Example Page Schema Structure:
```typescript
// packages/schema/src/dto/event-header.ts
export const EventHeaderDataSchema = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    rsvpStatus: true,
  }),
});

export const EventHeaderErrorSchema = z.discriminatedUnion('_tag', [
  z.object({ _tag: z.literal('EventNotFoundError'), message: z.string() }),
  z.object({ _tag: z.literal('EventUserNotMemberError'), message: z.string() }),
]);

export type EventHeaderResult = ResultTuple<EventHeaderError, EventHeaderData>;
```

### 2. Service Layer (`packages/services`)

The service layer handles all business logic and database operations using Effect for functional error handling:

- **Effect-based Services**: All services use Effect for composable error handling
- **Database Operations**: Wrapped in `dbOperation` for consistent retry logic
- **Sentry Integration**: Automatic error tracking via `SentryHelpers.withServiceOperation`
- **Schema Validation**: All data is validated against schemas before returning

#### Service Pattern:
```typescript
export const getEventHeaderData = async (
  eventId: string,
  userId: string
): Promise<EventHeaderResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      const eventData = yield* dbOperation(
        () => db.event.findFirst({ ... }),
        cause => new Error(`Failed to fetch: ${cause}`),
        'operation description'
      );
      
      // Validate and return ResultTuple
      const validatedResult = EventHeaderDataSchema.parse(result);
      return success(validatedResult);
    }),
    'service-name',
    'operation-name',
    contextData
  );
  
  return Effect.runPromise(effect);
};
```

### 3. API Layer (`packages/api`)

The API layer provides tRPC routers that expose service functions:

- **Type-safe Endpoints**: All endpoints return ResultTuple types
- **Authentication**: Protected procedures ensure user authentication
- **Input Validation**: Zod schemas validate all inputs
- **Direct Service Calls**: Routers simply call service functions

#### API Pattern:
```typescript
export const eventRouter = createTRPCRouter({
  getHeaderData: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getEventHeaderData(input.id, ctx.userId);
    }),
});
```

### 4. Hooks Layer (`packages/hooks`)

The hooks layer provides React Query hooks with built-in real-time synchronization:

- **tRPC Integration**: Uses tRPC client for type-safe API calls
- **Real-time Updates**: Supabase Realtime integration for live data sync
- **Optimistic Updates**: Smart cache updates for instant UI feedback
- **Error Handling**: Consistent error states across all hooks

#### Hook Organization:
```
packages/hooks/src/
├── queries/                 # All query hooks
│   ├── post.ts             # Post-related queries
│   ├── invite.ts           # Invite-related queries
│   ├── notification.ts     # Notification queries
│   ├── member.ts           # Member/Person queries
│   ├── settings.ts         # Settings queries
│   ├── availability.ts     # Availability queries
│   └── pages/             # Page-specific queries
│       ├── event-page.ts
│       ├── my-events.ts
│       └── ...
├── mutations/              # All mutation hooks
│   ├── event.ts           # Event mutations
│   ├── post.ts            # Post/Reply mutations
│   ├── invite.ts          # Invite mutations
│   ├── notification.ts    # Notification mutations
│   ├── availability.ts    # Availability mutations
│   └── settings.ts        # Settings mutations
└── index.ts               # Barrel export for all hooks
```

#### Hook Pattern:
```typescript
export function useEventHeader(eventId: string) {
  const query = api.event.getHeaderData.useQuery(
    { id: eventId },
    { 
      staleTime: 30 * 1000, 
      gcTime: 5 * 60 * 1000,
      retry: false, // Retries are handled by Effect layer
    }
  );

  useSupabaseRealtime({
    channel: `event-header-${eventId}`,
    changes: [
      {
        table: 'Event',
        filter: `id=eq.${eventId}`,
        event: '*',
        handler: ({ payload, queryClient }) => {
          // Update cache with real-time data
        },
      },
    ],
  }, [eventId]);

  return { data: query.data, isLoading: query.isLoading };
}
```

### 5. Server Prefetch (`packages/hooks/server`)

Server-side prefetching for SSR and hydration:

- **Parallel Prefetching**: All component data fetched in parallel
- **Dehydrated State**: React Query state serialized for client hydration
- **Error Resilience**: Continues rendering even if prefetch fails

#### Prefetch Pattern:
```typescript
export async function prefetchEventPageComponents(eventId: string, userId?: string) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);
  
  await Promise.allSettled([
    helpers.event.getHeaderData.prefetch({ id: eventId }),
    helpers.event.getMemberListData.prefetch({ id: eventId }),
    helpers.event.getPostFeedData.prefetch({ id: eventId }),
  ]);
  
  return dehydrate(queryClient);
}
```

### 6. Page Components (`apps/web/app`)

Next.js app router pages follow a consistent pattern:

```typescript
export default async function EventPage({ params }) {
  const { eventId } = await params;
  const { userId } = await auth();

  if (!userId) redirect('/sign-in');

  try {
    const dehydratedState = await prefetchEventPageComponents(eventId, userId);
    
    return (
      <HydrationBoundary state={dehydratedState}>
        <EventHeader eventId={eventId} />
        <MemberList eventId={eventId} />
        <PostFeed eventId={eventId} />
      </HydrationBoundary>
    );
  } catch (error) {
    return <ErrorPage />;
  }
}
```

## Data Flow

1. **Page Load**: Server component authenticates user and calls prefetch function
2. **Prefetch**: Multiple API calls made in parallel to gather all page data
3. **Hydration**: Dehydrated state passed to client via HydrationBoundary
4. **Client Render**: Components use hooks that already have cached data
5. **Real-time Sync**: Supabase subscriptions keep data fresh
6. **User Actions**: Mutations trigger optimistic updates and server sync

## Key Benefits

### 1. Type Safety
- End-to-end type safety from database to UI
- Discriminated unions for exhaustive error handling
- Zod validation ensures data integrity

### 2. Performance
- Parallel data fetching reduces latency
- Server-side rendering for instant page loads
- Smart caching prevents unnecessary requests
- Real-time updates without polling

### 3. Developer Experience
- Consistent patterns across all pages
- Clear separation of concerns
- Easy to test each layer independently
- Self-documenting code with TypeScript

### 4. Error Handling
- Functional error handling with Effect
- Type-safe error discrimination
- Automatic Sentry integration
- Graceful degradation
- Retry logic centralized in service layer (not in React Query)

### 5. Real-time Features
- Automatic UI updates when data changes
- Optimistic updates for instant feedback
- Conflict resolution built-in
- Works offline with sync on reconnect

## Page Implementations

### Data-Fetching Pages
1. **Event Page** (`/event/[eventId]`)
   - Components: EventHeader, MemberList, PostFeed
   - Real-time: Event updates, membership changes, new posts

2. **Event Subpages** - All following the same pattern:
   - **Invite Management** (`/event/[eventId]/invite`)
     - Components: InviteCardList
     - Real-time: Invite changes, person updates
   - **Attendees** (`/event/[eventId]/attendees`)
     - Components: AttendeeCount, AttendeeList
     - Real-time: Membership and person updates
   - **Availability Voting** (`/event/[eventId]/availability`)
     - Components: AvailabilityForm
     - Real-time: Availability and date option changes
   - **New Post** (`/event/[eventId]/new-post`)
     - Components: Editor
     - Real-time: Not needed (creation page)
   - **Edit Event** (`/event/[eventId]/edit`)
     - Components: EditEventInfo
     - Real-time: Event updates
   - **Date Selection** (`/event/[eventId]/date-select`)
     - Components: DateCardList
     - Real-time: Availability and date option changes
   - **Change Date Hub** (`/event/[eventId]/change-date`)
     - Components: Option selection (single/multi)
     - Real-time: Not needed (navigation page)
   - **Change Date Single** (`/event/[eventId]/change-date/single`)
     - Components: EditEventSingleDate
     - Real-time: Event date changes
   - **Change Date Multi** (`/event/[eventId]/change-date/multi`)
     - Components: EditEventMultiDate
     - Real-time: Potential date time changes

3. **MyEvents Page** (`/events`)
   - Components: EventList
   - Real-time: Event updates, membership changes

4. **Post Detail Page** (`/post/[postId]`)
   - Components: FullPost, Replies
   - Real-time: Post edits, new replies

5. **Invite Page** (`/invite/[inviteId]`)
   - Components: InviteDetails
   - Real-time: Not needed (invites are static)

6. **Settings Page** (`/settings/notifications`)
   - Components: NotificationSettings
   - Real-time: Not needed (user-specific)

### Static/Form Pages
1. **Home Page** (`/`) - Static landing page
2. **Auth Pages** (`/sign-in`, `/sign-up`) - Handled by Clerk
3. **New Event Pages** (`/create/*`) - Client-side forms

## Best Practices

1. **Always use ResultTuple** for service returns
2. **Validate all data** with Zod schemas
3. **Prefetch in parallel** when possible
4. **Handle all error cases** explicitly
5. **Keep components focused** on single responsibilities
6. **Use real-time updates** for collaborative features
7. **Test error scenarios** as thoroughly as success cases
8. **Disable React Query retries** - Effect layer handles all retry logic
9. **Centralize retry policies** in the service layer for consistency

## Refactoring Status

All pages have been systematically refactored to follow the new architecture pattern:
- ✅ Proper server-side prefetching with HydrationBoundary
- ✅ ResultTuple error handling with discriminated unions
- ✅ Effect services with logging and Sentry integration
- ✅ Real-time updates via Supabase where applicable
- ✅ React Query with retries disabled (handled by Effect layer)
- ✅ Type-safe schemas using Zod and Prisma `.pick()`

## Future Improvements

1. **Offline Support**: Add service workers for full offline capability
2. **Optimistic Mutations**: Expand optimistic updates to more operations
3. **GraphQL Migration**: Consider GraphQL for more flexible queries
4. **Edge Functions**: Move some services to edge for lower latency
5. **Subscription Optimization**: Batch real-time subscriptions for efficiency
