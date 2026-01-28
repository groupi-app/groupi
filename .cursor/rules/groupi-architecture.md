# Groupi Architecture Rules for Cursor AI

## Project Overview

This is a cross-platform event planning application using:

- **Backend**: Convex (real-time database with built-in auth)
- **Web**: Next.js 16 (client-only with App Router)
- **Mobile**: React Native with Expo
- **Shared**: Cross-platform business logic in packages/shared

## Architecture Principles

### 1. Real-Time First

- Use Convex useQuery for all data fetching (never useState + useEffect)
- All mutations use Convex useMutation with optimistic updates
- Never manually manage cache - Convex handles real-time subscriptions

### 2. Cross-Platform Design

- 95% of business logic is shared between web and mobile
- Use factory pattern for dependency injection: `createDomainHooks(api: ConvexApi)`
- Platform differences are abstracted through adapters

### 3. Client-Only Architecture

- No server-side rendering or API routes in Next.js
- No server actions or middleware
- Pure client applications consuming Convex backend

## Package Structure & Rules

### `/convex/` - Backend Functions

**Rules:**

- Define all schemas in `convex/schema.ts`
- Organize by domain: `convex/users/queries.ts`, `convex/users/mutations.ts`
- Always use `convex/values` for validation
- Require auth in mutations: `const user = await requireAuth(ctx)`
- Use `console.log` for logging (official Convex method)

**Example:**

```typescript
// convex/events/mutations.ts
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    return await ctx.db.insert('events', {
      ...args,
      creatorId: user._id,
      createdAt: Date.now(),
    });
  },
});
```

### `/packages/shared/` - Cross-Platform Business Logic

**Critical Rules:**

- **NEVER** import platform-specific modules (`react-native`, `next/*`, `expo-*`)
- **ALWAYS** use factory pattern for hooks
- **ALL** business logic must work on both web and mobile
- Use platform abstractions for navigation, storage, notifications

**Structure:**

- `hooks/use{Domain}Data.ts` - Data fetching hooks
- `hooks/use{Domain}Actions.ts` - Action hooks with error handling
- `platform/` - Platform abstractions
- `utils/` - Cross-platform utilities

**Example:**

```typescript
// packages/shared/src/hooks/useEventActions.ts
export function createEventActionHooks(api: ConvexApi) {
  function useCreateEvent() {
    const mutation = useMutation(api.events.mutations.createEvent);

    return async (data: CreateEventInput) => {
      try {
        const result = await mutation(data);
        toast.success('Event created successfully!');
        navigation.push(`/event/${result}`);
        return result;
      } catch (error) {
        toast.error('Failed to create event');
        throw error;
      }
    };
  }

  return { useCreateEvent };
}
```

### `/apps/web/` - Next.js Web Application

**Rules:**

- Use shared hooks: `const { useEventData } = createEventHooks(api)`
- Set up platform adapters in `lib/platform.ts`
- Use App Router in `app/` directory
- Style with Tailwind CSS and shadcn/ui components

### `/apps/mobile/` - React Native Mobile Application

**Rules:**

- Use same shared hooks as web: `const { useEventData } = createEventHooks(api)`
- Set up platform adapters in `lib/platform-setup.ts`
- Use React Native components and StyleSheet
- Access Expo APIs only through platform adapters

## Feature Development Process

### Required Order:

1. **Backend First**: Define schema → queries → mutations
2. **Shared Logic**: Create hooks in packages/shared
3. **Platform UI**: Implement web and mobile components

### Example: Adding Comments Feature

#### Step 1: Backend (Convex)

```typescript
// convex/schema.ts
comments: defineTable({
  content: v.string(),
  authorId: v.id('users'),
  postId: v.id('posts'),
}).index('by_post', ['postId']);

// convex/comments/queries.ts
export const getCommentsByPost = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    return await ctx.db
      .query('comments')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();
  },
});

// convex/comments/mutations.ts
export const createComment = mutation({
  args: { content: v.string(), postId: v.id('posts') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    return await ctx.db.insert('comments', {
      ...args,
      authorId: user._id,
    });
  },
});
```

#### Step 2: Shared Business Logic

```typescript
// packages/shared/src/hooks/useCommentData.ts
export function createCommentDataHooks(api: ConvexApi) {
  function useCommentsByPost(postId: string) {
    return useQuery(api.comments.queries.getCommentsByPost, { postId });
  }
  return { useCommentsByPost };
}

// packages/shared/src/hooks/useCommentActions.ts
export function createCommentActionHooks(api: ConvexApi) {
  function useCreateComment() {
    const mutation = useMutation(api.comments.mutations.createComment);
    return async (data: CreateCommentInput) => {
      try {
        const result = await mutation(data);
        toast.success('Comment posted!');
        return result;
      } catch (error) {
        toast.error('Failed to post comment');
        throw error;
      }
    };
  }
  return { useCreateComment };
}
```

#### Step 3: Platform UI Implementation

```typescript
// Web: apps/web/src/components/CommentList.tsx
import { createCommentDataHooks } from '@groupi/shared/hooks';

export function CommentList({ postId }: { postId: string }) {
  const { useCommentsByPost } = createCommentDataHooks(api);
  const comments = useCommentsByPost(postId);

  if (!comments) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {comments.map(comment => <CommentCard key={comment._id} comment={comment} />)}
    </div>
  );
}

// Mobile: apps/mobile/src/components/CommentList.tsx
import { createCommentDataHooks } from '@groupi/shared/hooks';

export function CommentList({ postId }: { postId: string }) {
  const { useCommentsByPost } = createCommentDataHooks(api);
  const comments = useCommentsByPost(postId);

  if (!comments) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={comments}
      renderItem={({ item }) => <CommentCard comment={item} />}
      keyExtractor={item => item._id}
    />
  );
}
```

## Code Quality Standards

### Error Handling

```typescript
// ✅ Always handle errors in action hooks
function useCreateEvent() {
  const mutation = useMutation(api.events.mutations.createEvent);

  return async (data: CreateEventInput) => {
    try {
      const result = await mutation(data);
      toast.success('Event created!');
      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create event: ${message}`);
      return { success: false, error: message };
    }
  };
}

// ❌ Never let errors bubble unhandled
function useBadCreateEvent() {
  const mutation = useMutation(api.events.mutations.createEvent);
  return mutation; // Error handling missing!
}
```

### Platform Abstraction

```typescript
// ✅ Use platform abstractions in shared code
import { navigation, storage, toast } from '@groupi/shared/platform';

function handleEventCreated(eventId: string) {
  navigation.push(`/event/${eventId}`);
  storage.setItem('lastEventId', eventId);
  toast.success('Event created!');
}

// ❌ Never use platform-specific imports in shared code
import { useRouter } from 'next/navigation'; // Only works on web!
import { useNavigation } from '@react-navigation/native'; // Only works on mobile!
```

### Import Patterns

```typescript
// ✅ Correct imports for shared package
import { createEventHooks } from '@groupi/shared/hooks';
import { formatDate } from '@groupi/shared';
import { navigation } from '@groupi/shared/platform';

// ✅ Correct imports for web app
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';

// ✅ Correct imports for mobile app
import { StyleSheet } from 'react-native';

// ❌ Wrong: Platform-specific in shared package
import { useRouter } from 'next/navigation'; // In packages/shared/ - FORBIDDEN
```

## File Organization

### Naming Conventions

- Hooks: `use{Domain}Data.ts`, `use{Domain}Actions.ts`
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Convex functions: `domain/queries.ts`, `domain/mutations.ts`

### Directory Structure

```
/convex/               # Backend functions and schema
  schema.ts           # Database schema
  {domain}/
    queries.ts        # Read operations
    mutations.ts      # Write operations

/packages/shared/     # Cross-platform business logic
  src/hooks/          # Business logic hooks
  src/platform/       # Platform abstractions
  src/utils/          # Cross-platform utilities
  src/types/          # Shared types

/apps/web/           # Next.js web application
  src/app/           # App Router pages
  src/components/    # Web-specific components
  src/lib/           # Web utilities

/apps/mobile/        # React Native mobile app
  src/screens/       # Screen components
  src/components/    # Mobile-specific components
  src/lib/           # Mobile utilities
```

## Development Workflow

### Daily Development

1. `pnpm convex:dev` - Start Convex backend
2. `pnpm dev` - Start web development (or `pnpm dev:all` for web + mobile)
3. Make changes to shared business logic first
4. Implement platform-specific UI
5. `pnpm generate` - Regenerate types after schema changes
6. Test on both platforms
7. `pnpm check` - Run all quality checks

### Common Tasks

- **Adding new feature**: Backend → Shared → Web UI → Mobile UI
- **Fixing bug**: Identify if it's in shared logic or platform-specific
- **Performance**: Use Convex indexes and avoid manual cache management
- **Styling**: Web uses Tailwind, Mobile uses StyleSheet

For complete documentation of all available scripts, see [scripts.md](./scripts.md).

## Anti-Patterns to Avoid

❌ **Don't**: Mix platform detection in shared code
❌ **Don't**: Import React Native modules in web app
❌ **Don't**: Import Next.js modules in mobile app
❌ **Don't**: Use useState + useEffect for data fetching (use Convex useQuery)
❌ **Don't**: Skip error handling in action hooks
❌ **Don't**: Put business logic in UI components
❌ **Don't**: Use server-side patterns (API routes, server actions)

✅ **Do**: Use factory pattern for dependency injection
✅ **Do**: Abstract platform differences through adapters
✅ **Do**: Handle all errors with user feedback
✅ **Do**: Keep business logic in shared package
✅ **Do**: Use Convex for all data operations
✅ **Do**: Test features on both platforms
