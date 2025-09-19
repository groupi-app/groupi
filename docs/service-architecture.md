# Service Architecture Documentation

## Overview

This document outlines the standardized patterns for service architecture in the Groupi monorepo, focusing on error handling, resilience, and cross-platform compatibility with end-to-end type safety.

## Architecture Decision: tRPC + Safe-Wrapper Tuple Pattern

**Decision**: Use tRPC with safe-wrapper tuple pattern, returning `[error, result]` tuples all the way down to components instead of throwing exceptions.

**Rationale**:

- **End-to-End Type Safety**: Safe-wrapper provides built-in discriminated union typing
- **Consistent Error Handling**: Same tuple pattern from service to UI, no exceptions
- **Built on React Query**: All caching, optimistic updates, and performance benefits
- **Better Developer Experience**: Auto-generated hooks with proper error handling
- **Cross-Platform Ready**: Same client code works in web and React Native
- **Zero Configuration**: Safe-wrapper handles complex discriminated union typing automatically

## Complete Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Components    │───▶│   tRPC Client    │───▶│ tRPC Procedures │───▶│  Effect Services │
│  (Web/Mobile)   │    │ (React Query)    │    │  (Return Tuples)│    │   (Core Logic)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────────┘
                                │                         │                        │
                                │                         │                        │
                                ▼                         ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
                       │   Tuple Pattern  │    │   Safe-Wrapper  │    │ [error, result]  │
                       │   [error, data]  │    │   Auto-Generated│    │ Discriminated    │
                       │   Destructuring  │    │   Type Safety   │    │ Union Tuples     │
                       └──────────────────┘    └─────────────────┘    └──────────────────┘
```

## Four-Layer Architecture with Tuple Pattern

### 1. Effect Functions (Core Business Logic)

- **Location**: `packages/services/src/[service].ts`
- **Purpose**: Pure business logic with comprehensive error handling
- **Pattern**: Effect.gen with proper error types and retry logic
- **Instrumentation**: Sentry integration for monitoring
- **No Change**: Keep exactly as they are!

```typescript
export const createResourceEffect = (
  data: CreateResourceInput,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Validation (business logic - no retry)
      const validatedData = yield* _(
        businessLogicOperation(
          () => CreateResourceInputSchema.parse(data),
          error => new ValidationError(error),
          'Validate create resource input'
        )
      );

      // Database operation (with retry)
      const resource = yield* _(
        dbOperation(
          () => db.resource.create({ data: validatedData }),
          error => new DatabaseError(error),
          `Create resource: ${data.name}`
        )
      );

      return createResourceDTO(resource);
    }),
    {
      name: 'createResource',
      data: { userId, resourceType: data.type },
    }
  );
```

### 2. Safe Wrapper Functions (Tuple Pattern)

- **Location**: Same file as Effect functions
- **Purpose**: Convert Effect to `[error, result]` tuple pattern using safe-wrapper
- **Pattern**: Use `safe()` from safe-wrapper library for automatic discriminated union typing
- **No Change**: Keep exactly as they are!

```typescript
// Helper function that throws (for safe-wrapper) - keep internal
const createResourceThrows = async (
  data: CreateResourceInput,
  userId: string
) => Effect.runPromise(createResourceEffect(data, userId));

// Safe wrapper - clean export names (safe-wrapper handles tuple pattern)
export const createResource = safe(createResourceThrows);
export const getResource = safe(getResourceThrows);
export const listResources = safe(listResourcesThrows);
export const updateResource = safe(updateResourceThrows);
export const deleteResource = safe(deleteResourceThrows);
```

### 3. tRPC Procedures (Return Tuples Directly)

- **Location**: `packages/api/src/routers/[resource].ts`
- **Purpose**: Type-safe API endpoints that return safe-wrapper tuples
- **Pattern**: tRPC procedures that return `[error, result]` tuples directly to components

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { CreateResourceInputSchema } from '@groupi/schema';
import {
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
} from '@groupi/services';

export const resourceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateResourceInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await createResource(input, ctx.userId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await getResource(input.id, ctx.userId);
    }),

  list: protectedProcedure
    .input(
      z.object({
        filter: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await listResources(input, ctx.userId);
    }),

  update: protectedProcedure
    .input(UpdateResourceInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateResource(input, ctx.userId);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteResource(input.id, ctx.userId);
    }),
});

export type ResourceRouter = typeof resourceRouter;
```

### 4. Component Usage (Handle Tuples with Type Safety)

- **Location**: Components and custom hooks
- **Purpose**: Handle `[error, result]` tuples with proper type safety
- **Pattern**: Destructure tuples and use type guards for error handling

```typescript
// Direct component usage with tuple handling
import { api } from '@/utils/api';

export function CreateResourceForm() {
  const utils = api.useContext();

  const createResource = api.resource.create.useMutation({
    onSuccess: (result) => {
      const [error, resource] = result;

      if (error) {
        // Handle different error types appropriately
        if (isValidationError(error)) {
          toast.error(`Validation failed: ${error.message}`);
        } else if (isAuthorizationError(error)) {
          toast.error('You are not authorized to perform this action');
        } else {
          toast.error('Something went wrong');
        }
        return;
      }

      // TypeScript knows resource is guaranteed to exist here
      toast.success('Resource created successfully');
      utils.resource.list.invalidate();
    },
  });

  const handleSubmit = async (data: CreateResourceInput) => {
    const [error, resource] = await createResource.mutateAsync(data);

    if (error) {
      // Handle error in component
      return;
    }

    // TypeScript knows resource is guaranteed to exist
    console.log('Created resource:', resource.id);
  };

  return (
    <form onSubmit={handleSubmit}>
      {createResource.isLoading && <div>Creating...</div>}
      {/* form fields */}
    </form>
  );
}

// Query usage with tuple handling
export function ResourceList() {
  const { data: result, isLoading } = api.resource.list.useQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!result) return <div>No data</div>;

  const [error, resources] = result;

  if (error) {
    if (isAuthorizationError(error)) {
      return <div>You are not authorized to view resources</div>;
    }
    return <div>Error: {error.message}</div>;
  }

  // TypeScript knows resources is guaranteed to be ResourceDTO[]
  return (
    <div>
      {resources.map(resource => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
```

## Custom Hooks for Better Ergonomics

Create wrapper hooks to make tuple handling more ergonomic in components:

```typescript
// packages/hooks/src/resource-hooks.ts
import { api } from '@/utils/api';

export function useCreateResource() {
  const utils = api.useContext();

  const mutation = api.resource.create.useMutation({
    onSuccess: (result) => {
      const [error, resource] = result;

      if (!error) {
        // Only invalidate cache on actual success
        utils.resource.list.invalidate();
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: async (data: CreateResourceInput) => {
      const result = await mutation.mutateAsync(data);
      return result; // Returns [error, resource] tuple from safe-wrapper
    },
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useResourceList(params: { page: number; limit: number }) {
  const query = api.resource.list.useQuery(params);

  const [error, resources] = query.data || [null, null];

  return {
    resources,
    error,
    isLoading: query.isLoading,
    isError: !!error,
    refetch: query.refetch,
  };
}

// Usage with custom hooks
export function ResourceManagement() {
  const { resources, error, isLoading } = useResourceList({ page: 1, limit: 10 });
  const createResource = useCreateResource();

  const handleCreate = async (data: CreateResourceInput) => {
    const [error, resource] = await createResource.mutateAsync(data);

    if (error) {
      if (isValidationError(error)) {
        toast.error(`Validation failed: ${error.message}`);
      }
      return;
    }

    toast.success('Resource created successfully');
  };

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    return <div>Error loading resources: {error.message}</div>;
  }

  return (
    <div>
      <CreateResourceButton onCreate={handleCreate} />
      {resources?.map(resource => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
```

## tRPC Setup Structure

### App Router Setup

```typescript
// packages/api/src/root.ts
import { createTRPCRouter } from './trpc';
import { notificationRouter } from './routers/notification';
import { eventRouter } from './routers/event';
import { memberRouter } from './routers/member';

export const appRouter = createTRPCRouter({
  notification: notificationRouter,
  event: eventRouter,
  member: memberRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

### tRPC Configuration

```typescript
// packages/api/src/trpc.ts
import { initTRPC } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure with auth
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { userId } = await auth();

  if (!userId) {
    // Return tuple instead of throwing
    return next({
      ctx: {
        ...ctx,
        userId: null,
      },
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId,
    },
  });
});
```

## Cross-Platform Considerations

### Web App (`apps/web`)

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@groupi/api';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

### React Native App

```typescript
// Same tRPC client works perfectly with tuple pattern!
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@groupi/api';

export const api = createTRPCReact<AppRouter>();

// Setup with custom fetch for React Native
const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-api.com/api/trpc',
      headers: async () => {
        const token = await getAuthToken(); // Platform-specific auth
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});

export default function App() {
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      {/* Your app */}
    </api.Provider>
  );
}
```

## Benefits of Safe-Wrapper + tRPC Tuple Pattern

1. **Built-in Discriminated Unions**: Safe-wrapper provides proper `[error, result]` typing automatically
2. **Zero Configuration**: No custom type definitions or complex patterns needed
3. **Consistent Error Handling**: Same tuple pattern from service to UI, no exceptions
4. **Type Safety All the Way Down**: TypeScript automatically narrows types after error checks
5. **Better Developer Experience**: Components decide how to handle each error type
6. **Cross-Platform Ready**: Same pattern works perfectly in web and React Native
7. **Performance**: No exception throwing/catching overhead
8. **Predictable**: No unexpected thrown exceptions anywhere in the stack

## Migration Checklist

### For Each Service:

1. **Effect Functions**: ✅ Keep exactly as they are - no changes needed
2. **Safe Wrapper Functions**: ✅ Keep exactly as they are - no changes needed
3. **tRPC Procedures**: 🔄 Create procedures that return safe-wrapper tuples directly
4. **Remove Throwing Service Functions**: 🔄 Delete functions that throw after checking tuples
5. **Update Components**: 🔄 Handle tuples with destructuring and type guards
6. **Create Custom Hooks**: 🔄 Add wrapper hooks for better component ergonomics

### Service-Specific Patterns:

#### CRUD Operations (Return Tuples)

```typescript
// All procedures return [error, result] tuples
api.resource.create.useMutation(); // Returns [error, resource]
api.resource.list.useQuery(); // Returns [error, resources]
api.resource.getById.useQuery(); // Returns [error, resource]
api.resource.update.useMutation(); // Returns [error, resource]
api.resource.delete.useMutation(); // Returns [error, result]
```

#### Nested Resources

```typescript
// Clean nested router structure with tuple returns
api.event.member.list.useQuery({ eventId }); // Returns [error, members]
api.event.member.add.useMutation(); // Returns [error, member]
api.event.member.remove.useMutation(); // Returns [error, result]
```

## Development Workflow

1. **Define Schema**: Input/output schemas in `@groupi/schema` (same as before)
2. **Keep Effect Functions**: No changes to your existing business logic
3. **Keep Safe Functions**: No changes to your existing safe-wrapper functions
4. **Create tRPC Procedure**: Return safe-wrapper tuples directly (no error conversion)
5. **Handle Tuples in Components**: Use destructuring and type guards
6. **Create Custom Hooks**: Add wrapper hooks for better ergonomics
7. **Test Integration**: Verify end-to-end tuple handling

## Example: Complete Notification Service Flow

```typescript
// 1. Effect Function (NO CHANGES)
export const createNotificationEffect = (data: CreateNotificationInput, userId: string) =>
  SentryHelpers.withServiceOperation(/* existing Effect logic */);

// 2. Safe Wrapper Function (NO CHANGES)
const createNotificationThrows = async (data: CreateNotificationInput, userId: string) =>
  Effect.runPromise(createNotificationEffect(data, userId));

export const createNotification = safe(createNotificationThrows);

// 3. tRPC Procedure (SIMPLE - RETURN TUPLE)
export const notificationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateNotificationInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly
      return await createNotification(input, ctx.userId);
    }),
});

// 4. Component Usage (HANDLE TUPLES)
function CreateNotificationButton() {
  const createNotification = api.notification.create.useMutation({
    onSuccess: (result) => {
      const [error, notification] = result;

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Notification created!');
    },
  });

  return (
    <button
      onClick={() => createNotification.mutate({ type: 'NEW_POST', personId: '123' })}
      disabled={createNotification.isLoading}
    >
      {createNotification.isLoading ? 'Creating...' : 'Create Notification'}
    </button>
  );
}
```

## Key Insights for Migration

- **Remove Throwing Functions**: Delete service functions like `createNotificationService` that throw after checking tuples
- **No Error Conversion**: Don't convert tuples to TRPCErrors - return them directly
- **Component Responsibility**: Let components decide how to handle each error type
- **Safe-Wrapper Magic**: The package handles all discriminated union complexity automatically
- **Consistent Pattern**: Same `[error, result]` approach works for all services
- **Type Safety**: TypeScript automatically narrows types after error checks
- **Clean Export Names**: Use natural function names without "safe" prefix

This architecture leverages safe-wrapper's built-in discriminated union support for maximum simplicity and type safety, with tuples flowing from services all the way down to components for consistent, predictable error handling.
