# State Management Architecture

This document describes the state management patterns used in the Groupi application. Follow these patterns consistently across all components to ensure predictable behavior, smooth animations, and proper data synchronization.

## Table of Contents

1. [Data Flow Overview](#data-flow-overview)
2. [Server-Side Caching](#server-side-caching)
3. [Client-Side State Categories](#client-side-state-categories)
4. [Real-Time Sync Pattern](#real-time-sync-pattern)
5. [Animation-Safe Updates](#animation-safe-updates)
6. [Transient Form Pattern](#transient-form-pattern)
7. [Mutation Hook Checklist](#mutation-hook-checklist)

---

## Data Flow Overview

The application uses a combination of server-side caching (PPR), React Query for client state, and Pusher for real-time synchronization. This creates a seamless experience where data is fast to load, optimistically updated, and synchronized across clients.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Server (PPR/Cache)                                                          │
│         │                                                                    │
│         ▼                                                                    │
│  initialData prop ──────────────► React Query Cache                          │
│                                         │                                    │
│                                         ▼                                    │
│                                   User Action                                │
│                                         │                                    │
│                                         ▼                                    │
│                           Optimistic Update (setQueryData)                   │
│                           with { optimistic: true } flag                     │
│                                         │                                    │
│                                         ▼                                    │
│                              Server Action (mutation)                        │
│                                         │                                    │
│                           ┌─────────────┴─────────────┐                      │
│                           ▼                           ▼                      │
│                    updateTag()               Pusher trigger                  │
│                  (server cache)             (real-time sync)                 │
│                           │                           │                      │
│                           │                           ▼                      │
│                           │              Pusher handler receives             │
│                           │              event on all clients                │
│                           │                           │                      │
│                           │                           ▼                      │
│                           │              Replace optimistic item             │
│                           │              with real data (in-place)           │
│                           │                           │                      │
│                           └───────────────────────────┘                      │
│                                         │                                    │
│                                         ▼                                    │
│                              Smooth animation                                │
│                           (stable keys preserved)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Server renders first** - PPR provides fast initial loads with cached data
2. **Client hydrates** - React Query initializes with server data as `initialData`
3. **Optimistic by default** - User actions update UI immediately
4. **Pusher reconciles** - Real data replaces optimistic data seamlessly
5. **Animations preserved** - Stable keys ensure Framer Motion works correctly

---

## Server-Side Caching

Server-side caching is implemented in `packages/services/src/cache/` using Next.js 16's caching directives.

### Cache Directive

Use `"use cache: private"` for all cached functions because our service layer accesses user-specific data via `headers()`:

```typescript
'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
```

### Cache Tag Naming Convention

Tags follow a hierarchical naming pattern:

| Pattern | Example | Use Case |
|---------|---------|----------|
| `entity-{id}` | `event-abc123` | Invalidate all data for an entity |
| `entity-{id}-{relation}` | `event-abc123-posts` | Invalidate specific relation |
| `post-{id}` | `post-xyz789` | Single post and its data |
| `post-{id}-replies` | `post-xyz789-replies` | Just the replies |

```typescript
// Example: Caching post detail with multiple tags
export async function getCachedPostWithReplies(postId: string) {
  'use cache: private';
  
  cacheLife('posts');
  cacheTag(`post-${postId}`, `post-${postId}-replies`);
  
  const result = await fetchPostDetailPageData({ postId });
  return serializeResultTuple(result);
}
```

### Cache Life Profiles

Defined in `next.config.mjs`:

| Profile | Stale | Revalidate | Expire | Use Case |
|---------|-------|------------|--------|----------|
| `default` | 5 min | 2 min | 1 hour | General content |
| `event` | 5 min | 2 min | 30 min | Event headers, details |
| `posts` | 30 sec | 15 sec | 5 min | Posts, replies (frequently updated) |
| `user` | 5 min | 2 min | 15 min | User settings, preferences |

```typescript
cacheLife('posts'); // Short cache for frequently updated content
cacheLife('event'); // Longer cache for event metadata
```

### Cache Invalidation

Use `updateTag()` in server actions after successful mutations:

```typescript
// In server action after successful mutation
if (!result[0] && result[1]) {
  updateTag(`event-${eventId}`);
  updateTag(`event-${eventId}-posts`);
}
```

### Error Handling

**Never cache errors.** Use the try/catch pattern to only cache successful results:

```typescript
async function getCachedDataSuccess(id: string): Promise<Data> {
  'use cache: private';
  cacheLife('posts');
  cacheTag(`entity-${id}`);

  const result = await fetchData(id);
  if (result[0]) throw result[0]; // Throw error (not cached)
  return result[1]; // Return success (cached)
}

export async function getCachedData(id: string): Promise<ResultTuple<Error, Data>> {
  try {
    const data = await getCachedDataSuccess(id);
    return serializeResultTuple([null, data]);
  } catch (error) {
    // Errors bypass cache
    return serializeResultTuple([error, undefined]);
  }
}
```

---

## Client-Side State Categories

Client state falls into four categories. Use the appropriate pattern for each:

| Category | Purpose | Pattern | Resets on Navigation? | Examples |
|----------|---------|---------|----------------------|----------|
| **Server-synced** | Data from server, syncs in real-time | React Query + Pusher | No (persists in cache) | Post feed, replies, members |
| **Transient** | Form/input state that should reset | `useTransientForm` hook | Yes | Post editor, search filters |
| **Persistent** | User choices that survive navigation | Zustand or localStorage | No | Multi-step wizards, saved drafts |
| **Ephemeral** | Component-local, short-lived | `useState` | Yes (component unmounts) | Dialog open, hover state |

### When to Use Each

**Server-synced (React Query + Pusher)**
- Data that comes from the database
- Needs to sync across browser tabs/users
- Examples: posts, replies, event details, member lists

**Transient (useTransientForm)**
- Form inputs that should be empty on each visit
- Data being created (not yet saved)
- Examples: new post editor, reply form, search input

**Persistent (Zustand/localStorage)**
- User preferences during a session
- Draft content the user explicitly wants to save
- Examples: UI preferences, explicitly saved drafts

**Ephemeral (useState)**
- UI state that's only relevant while viewing
- Doesn't need to survive component unmount
- Examples: dropdown open state, tooltip visibility

---

## Real-Time Sync Pattern

For server-synced data, use the `usePusherRealtime` hook with React Query.

### Server Component (Data Provider)

```typescript
// Server component fetches cached data
export async function PostFeed({ eventId }: { eventId: string }) {
  const [error, data] = await getCachedPostFeedData(eventId);
  
  if (error) return <ErrorState error={error} />;
  
  return <PostFeedClient initialData={data} eventId={eventId} />;
}
```

### Client Component (React Query + Pusher)

```typescript
'use client';

export function PostFeedClient({ 
  initialData, 
  eventId 
}: { 
  initialData: PostFeedData; 
  eventId: string;
}) {
  const queryClient = useQueryClient();

  // React Query manages client-side cache
  const { data } = useQuery({
    queryKey: qk.posts.feed(eventId),
    queryFn: () => fetchPostFeed(eventId),
    initialData, // Server data for instant load
    staleTime: 30 * 1000, // Match server cache TTL
  });

  // Pusher syncs real-time updates
  usePusherRealtime({
    channel: `event-${eventId}-posts`,
    event: 'post-changed',
    tags: [`event-${eventId}`, `event-${eventId}-posts`],
    queryKey: qk.posts.feed(eventId),
    onInsert: (newPost) => {
      queryClient.setQueryData<PostFeedData>(
        qk.posts.feed(eventId),
        (old) => {
          if (!old) return old;
          
          // Check for optimistic item to replace
          const optimisticIndex = old.posts.findIndex(
            p => 'optimistic' in p && p.optimistic
          );
          
          if (optimisticIndex !== -1) {
            // Replace optimistic with real data (preserves position)
            return {
              ...old,
              posts: old.posts.map((p, i) => 
                i === optimisticIndex ? newPost : p
              ),
            };
          }
          
          // No optimistic item, add to beginning
          return { ...old, posts: [newPost, ...old.posts] };
        }
      );
    },
    // onUpdate and onDelete handlers...
  });

  return <PostList posts={data.posts} />;
}
```

### Query Key Convention

Use the `qk` helper from `@/lib/query-keys` for consistent keys:

```typescript
qk.posts.feed(eventId)      // ['posts', 'feed', eventId]
qk.posts.detail(postId)     // ['posts', 'detail', postId]
qk.events.header(eventId)   // ['events', 'header', eventId]
qk.availability.data(eventId) // ['availability', 'data', eventId]
```

---

## Animation-Safe Updates

Framer Motion animations require stable item identity. Follow these rules:

### Rule 1: Use Database IDs as Keys

```tsx
// Good - stable ID
{posts.map(post => (
  <motion.div key={post.id} layout>
    <PostCard post={post} />
  </motion.div>
))}

// Bad - index changes when items are added/removed
{posts.map((post, index) => (
  <motion.div key={index} layout>
    <PostCard post={post} />
  </motion.div>
))}
```

### Rule 2: Optimistic Items Use Temporary IDs

When creating optimistic items, use a temporary ID format:

```typescript
// In mutation hook onMutate
queryClient.setQueryData(queryKey, (old) => ({
  ...old,
  posts: [
    {
      id: 'optimistic-' + Date.now(), // Temporary ID
      title: newPost.title,
      content: newPost.content,
      optimistic: true, // Flag for identification
    },
    ...old.posts,
  ],
}));
```

### Rule 3: Replace Optimistic Items In-Place

When Pusher delivers real data, replace the optimistic item at the same position:

```typescript
onInsert: (newPost) => {
  queryClient.setQueryData(queryKey, (old) => {
    // Find optimistic item by flag and matching content
    const optimisticIndex = old.posts.findIndex(p => 
      'optimistic' in p && 
      p.optimistic && 
      p.title === newPost.title
    );
    
    if (optimisticIndex !== -1) {
      // Replace in-place (same array position = smooth animation)
      return {
        ...old,
        posts: old.posts.map((p, i) => 
          i === optimisticIndex ? newPost : p
        ),
      };
    }
    
    // No optimistic item found, add normally
    return { ...old, posts: [newPost, ...old.posts] };
  });
}
```

### Rule 4: Use LayoutGroup for Related Animations

```tsx
import { LayoutGroup, motion } from 'framer-motion';

<LayoutGroup>
  {items.map(item => (
    <motion.div key={item.id} layout>
      <Item data={item} />
    </motion.div>
  ))}
</LayoutGroup>
```

### Rule 5: Never Use router.refresh()

`router.refresh()` causes a full re-render that breaks animations. Instead:

```typescript
// Bad - breaks animations
onSuccess: () => {
  router.refresh();
}

// Good - updates cache directly
onSuccess: (newData) => {
  queryClient.setQueryData(queryKey, (old) => ({
    ...old,
    items: [...old.items, newData],
  }));
}
```

---

## Transient Form Pattern

Forms that should reset when the user leaves (like the post editor) use explicit reset on user actions.

### The Problem

With `cacheComponents: true` and soft navigation, React may reuse component instances. This causes forms to retain stale state when navigating away and back.

### The Solution (Recommended)

**Explicitly reset the form when the user takes an action that leaves the page:**

```typescript
function PostEditor({ eventId }: Props) {
  const [resetKey, setResetKey] = useState(0);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' },
  });

  // Reset form and related state
  const resetFormState = useCallback(() => {
    form.reset({ title: '', content: '' });
    setResetKey(prev => prev + 1); // Force TipTap to sync
  }, [form]);

  // On successful submit
  const onSubmit = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        resetFormState(); // Clear form before navigating
        router.push('/success');
      },
    });
  };

  // On user choosing to leave (e.g., "Leave" button in unsaved changes dialog)
  const handleLeave = () => {
    resetFormState(); // Clear form before navigating
    router.push('/back');
  };

  return (
    <Form {...form}>
      {/* ... */}
      <TipTap content={field.value} resetKey={resetKey} />
    </Form>
  );
}
```

This is simpler and more reliable than navigation detection because:
- It works regardless of how Next.js handles caching
- The reset happens at a predictable, explicit time
- No complex ref comparison logic needed

### Alternative: useTransientForm Hook

For cases where you need automatic navigation-based reset, use the `useTransientForm` hook:

```typescript
import { useTransientForm } from '@/hooks/use-transient-form';

function SearchFilters() {
  const { form, resetForm } = useTransientForm({
    schema: filterSchema,
    defaultValues: { query: '', category: 'all' },
  });
  // Form resets when pathname changes
}
```

### TipTap Integration

TipTap editors need a `resetKey` prop to force content sync:

```typescript
// In Tiptap component
const hasInitializedRef = useRef(false);
const lastResetKeyRef = useRef(resetKey);

useEffect(() => {
  if (!editor) return;
  
  // Force sync on mount
  if (!hasInitializedRef.current) {
    hasInitializedRef.current = true;
    editor.commands.setContent(content);
    return;
  }
  
  // Force sync when resetKey changes (form was reset)
  if (lastResetKeyRef.current !== resetKey) {
    editor.commands.setContent(content);
    lastResetKeyRef.current = resetKey;
    return;
  }
  
  // Normal sync for prop changes
  if (editor.getHTML() !== content) {
    editor.commands.setContent(content);
  }
}, [content, editor, resetKey]);
```

---

## Mutation Hook Checklist

When creating mutation hooks, follow this template for consistency:

```typescript
export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInput): Promise<EntityData> => {
      const [error, data] = await createEntityAction(input);
      if (error) throw error;
      return data;
    },
    
    onMutate: async (newEntity) => {
      // 1. Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.entities.list(newEntity.parentId),
      });

      // 2. Save previous data for rollback
      const prev = queryClient.getQueryData(
        qk.entities.list(newEntity.parentId)
      );

      // 3. Optimistic update with `optimistic: true` flag
      queryClient.setQueryData(
        qk.entities.list(newEntity.parentId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [
              {
                id: 'optimistic-' + Date.now(),
                ...newEntity,
                optimistic: true,
              },
              ...old.items,
            ],
          };
        }
      );

      return { prev };
    },

    onError: (_err, newEntity, ctx) => {
      // 4. Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(
          qk.entities.list(newEntity.parentId),
          ctx.prev
        );
      }
    },

    onSuccess: (_data, _variables) => {
      // 5. Let Pusher handle replacing optimistic with real data
      // Don't invalidate queries or call router.refresh()
      // The server action triggers updateTag() + Pusher event
    },
  });
}
```

### Server Action Pattern

```typescript
'use server';

export async function createEntityAction(input: CreateInput) {
  const result = await createEntity(input);

  if (!result[0] && result[1]) {
    // Invalidate server cache
    updateTag(`parent-${input.parentId}`);
    updateTag(`parent-${input.parentId}-entities`);

    // Trigger Pusher for real-time sync
    await pusherServer.trigger(
      `parent-${input.parentId}-entities`,
      'entity-changed',
      { type: 'INSERT', new: result[1] }
    ).catch(console.error);
  }

  return result;
}
```

---

## Summary

| Scenario | Pattern |
|----------|---------|
| Fetching data for display | Server cache → React Query with `initialData` |
| Real-time sync | `usePusherRealtime` hook |
| User creates/updates data | Mutation hook with optimistic update |
| Form that should reset | `useTransientForm` hook |
| Form that should persist | Zustand store |
| Temporary UI state | `useState` |
| Invalidating cache | `updateTag()` in server action |
| Syncing to other clients | Pusher event in server action |

