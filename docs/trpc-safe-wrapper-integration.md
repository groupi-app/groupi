# tRPC + Safe-Wrapper Integration Guide

This document shows exactly how tRPC procedures integrate with our safe-wrapper pattern, preserving the tuple pattern all the way down to components.

## The Integration Pattern

### 1. Current Safe-Wrapper Pattern (Unchanged)

```typescript
// In packages/services/src/notification.ts
export const createNotificationEffect = (
  data: CreateNotificationInput,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Business logic with comprehensive error handling
      const validatedData = yield* _(
        businessLogicOperation(
          () => CreateNotificationInputSchema.parse(data),
          error => new ValidationError(error),
          'Validate notification input'
        )
      );

      const notification = yield* _(
        dbOperation(
          () => db.notification.create({ data: validatedData }),
          error => new DatabaseError(error),
          'Create notification'
        )
      );

      return createNotificationDTO(notification);
    }),
    { name: 'createNotification', data: { userId, type: data.type } }
  );

// Helper function that throws (for safe-wrapper)
const createNotificationThrows = async (
  data: CreateNotificationInput,
  userId: string
) => {
  return await Effect.runPromise(createNotificationEffect(data, userId));
};

// Safe wrapper - returns [error, result] tuple automatically
export const safeCreateNotification = safe(createNotificationThrows);
```

### 2. tRPC Procedure - Returns Tuple Directly

```typescript
// In packages/api/src/routers/notification.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { CreateNotificationInputSchema } from '@groupi/schema';
import {
  safeCreateNotification,
  safeListNotifications,
} from '@groupi/services';

export const notificationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateNotificationInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Safe-wrapper automatically returns [error, result] tuple
      return await safeCreateNotification(input, ctx.userId);
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      // Safe-wrapper automatically returns [error, notifications] tuple
      return await safeListNotifications(input, ctx.userId);
    }),
});
```

### 3. Component Usage - Handle Tuples with Proper Discriminated Union

```typescript
// In your component - safe-wrapper provides proper discriminated union typing
import { api } from '@/utils/api';

export function CreateNotificationButton() {
  const utils = api.useContext();

  const createNotification = api.notification.create.useMutation({
    onSuccess: (result) => {
      const [error, notification] = result;

      if (error) {
        // Handle error at component level
        if (isValidationError(error)) {
          toast.error('Validation failed: ' + error.message);
        } else if (isAuthorizationError(error)) {
          toast.error('You are not authorized to perform this action');
        } else {
          toast.error('Something went wrong');
        }
        return;
      }

      // TypeScript knows notification is guaranteed to exist here
      toast.success('Notification created successfully');
      utils.notification.list.invalidate();
    },
  });

  return (
    <button
      onClick={() => createNotification.mutate({
        type: 'NEW_POST',
        personId: '123'
      })}
      disabled={createNotification.isLoading}
    >
      {createNotification.isLoading ? 'Creating...' : 'Create Notification'}
    </button>
  );
}
```

## Query Pattern with Safe-Wrapper Tuples

```typescript
export function NotificationList() {
  const { data: result, isLoading } = api.notification.list.useQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;

  // Safe-wrapper provides proper tuple typing
  if (!result) return <div>No data</div>;

  const [error, notifications] = result;

  if (error) {
    if (isAuthorizationError(error)) {
      return <div>You are not authorized to view notifications</div>;
    }
    return <div>Error: {error.message}</div>;
  }

  // TypeScript knows notifications is guaranteed to be NotificationDTO[]
  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
```

## Custom Hook for Better Ergonomics

```typescript
// packages/hooks/src/notification-hooks.ts
import { api } from '@/utils/api';

export function useCreateNotification() {
  const utils = api.useContext();

  const mutation = api.notification.create.useMutation({
    onSuccess: (result) => {
      const [error, notification] = result;

      if (!error) {
        // Only invalidate cache on actual success
        utils.notification.list.invalidate();
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: async (data: CreateNotificationInput) => {
      const result = await mutation.mutateAsync(data);
      return result; // Returns [error, notification] tuple from safe-wrapper
    },
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
  };
}

// Usage in component
export function CreateNotificationButton() {
  const createNotification = useCreateNotification();

  const handleClick = async () => {
    const [error, notification] = await createNotification.mutateAsync({
      type: 'NEW_POST',
      personId: '123',
    });

    if (error) {
      if (isValidationError(error)) {
        toast.error(`Validation failed: ${error.message}`);
      } else if (isAuthorizationError(error)) {
        toast.error('You are not authorized to perform this action');
      } else {
        toast.error('Something went wrong');
      }
      return;
    }

    toast.success('Notification created successfully');
    // notification is fully typed and guaranteed to exist
    console.log('Created notification:', notification.id);
  };

  return (
    <button onClick={handleClick} disabled={createNotification.isLoading}>
      {createNotification.isLoading ? 'Creating...' : 'Create Notification'}
    </button>
  );
}
```

## Benefits of Safe-Wrapper + tRPC

### 1. **Built-in Discriminated Unions**

- Safe-wrapper already provides proper `[error, result]` tuple typing
- No need for custom type definitions
- TypeScript automatically narrows types after error checks

### 2. **Zero Configuration**

- Safe-wrapper handles the complex discriminated union typing
- Works out of the box with any async function
- Consistent pattern across all services

### 3. **Type Safety All the Way Down**

- Errors and results are both properly typed
- No optional chaining needed after error checks
- Compile-time guarantees about data availability

### 4. **Clean Error Handling**

- Component decides how to handle each error type
- No unexpected thrown exceptions
- Predictable error flow throughout the application

## Real Example: Event Service

### Current Safe Function (No Changes Needed)

```typescript
// packages/services/src/event-effect.ts - already exists
export const safeFetchEventData = safe(async (eventId: string) =>
  Effect.runPromise(fetchEventDataEffect(eventId))
);
```

### tRPC Procedure (New)

```typescript
// packages/api/src/routers/event.ts
export const eventRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly
      return await safeFetchEventData(input.id);
    }),
});
```

### Component Usage

```typescript
export function EventPage({ eventId }: { eventId: string }) {
  const { data: result, isLoading } = api.event.getById.useQuery({ id: eventId });

  if (isLoading) return <EventSkeleton />;
  if (!result) return <div>No data</div>;

  const [error, event] = result;

  if (error) {
    if (isNotFoundError(error)) {
      return <EventNotFound />;
    }
    if (isAuthorizationError(error)) {
      return <div>You don't have permission to view this event</div>;
    }
    return <div>Error loading event: {error.message}</div>;
  }

  // TypeScript knows event is guaranteed to exist and is fully typed
  return <EventDetails event={event} />;
}
```

## Migration Benefits

1. **No Changes to Services**: Your Effect functions and safe-wrapper patterns stay exactly the same
2. **Built-in Type Safety**: Safe-wrapper already provides proper discriminated union typing
3. **Simple tRPC Integration**: Just return the safe-wrapper tuple directly
4. **Better UX**: Components can handle different error types appropriately
5. **Cross-Platform**: Same pattern works in web and React Native

## Key Insights

- **Safe-wrapper does the heavy lifting**: The package already provides proper discriminated union typing
- **No custom types needed**: Just use safe-wrapper's built-in tuple returns
- **tRPC passes tuples through**: Procedures return `[error, result]` directly to components
- **Components handle tuples**: Use destructuring and type guards for clean error handling
- **Remove throwing service functions**: Delete functions that throw after checking tuples
- **Consistent pattern**: Same approach works for all services

This approach leverages safe-wrapper's built-in discriminated union support, making the integration much simpler and more reliable than custom typing solutions.
