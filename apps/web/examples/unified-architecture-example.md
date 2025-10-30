# Unified Architecture Example

This document shows how to integrate the new unified real-time architecture with existing services.

## 1. Server Component with Prefetching

```typescript
// app/(event)/event/[eventId]/page.tsx
import { prefetchEventData, UnifiedQueryProvider } from '@groupi/hooks';
import { auth } from '@groupi/services';

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [error, userId] = await auth.getCurrentUserId();
  const { eventId } = await params;
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Server-side prefetch
  const dehydratedState = await prefetchEventData(eventId, userId);

  return (
    <div>
      <EventHeader eventId={eventId} />
      <PostFeed eventId={eventId} />
      <MemberList eventId={eventId} />
    </div>
  );
}
```

## 2. Updated Service with Real-time Invalidation

```typescript
// packages/services/src/post.ts
import { invalidatePostQueries } from './realtime-invalidation';

export const createPost = safeWrapper<
  [string, string, CreatePostData],
  PostDTO,
  PostCreationError | PostUserNotMemberError
>(
  (eventId: string, userId: string, data: CreatePostData) =>
    Effect.gen(function* () {
      // ... existing post creation logic ...
      const post = yield* createPostEffect(eventId, userId, data);

      // Send real-time invalidation (fire-and-forget)
      invalidatePostQueries(eventId, post.id, MessageTypes.POST_CREATED, {
        postId: post.id,
        title: data.title,
        authorId: userId,
      });

      return post;
    }),
  PostDTO
);
```

## 3. Root Layout with Unified Providers

```typescript
// app/layout.tsx
import {
  UnifiedQueryProvider,
  UnifiedWebPusherProvider,
  prefetchUserDashboard
} from '@groupi/hooks';
import { auth } from '@groupi/services';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [error, userId] = await auth.getCurrentUserId();

  // Prefetch user data
  const dehydratedState = userId
    ? await prefetchUserDashboard(userId)
    : undefined;

  return (
    <html>
      <body>
        <UnifiedWebPusherProvider
          appKey={env.NEXT_PUBLIC_PUSHER_APP_KEY}
          cluster={env.NEXT_PUBLIC_PUSHER_APP_CLUSTER}
        >
          <UnifiedQueryProvider
            dehydratedState={dehydratedState}
            userId={userId}
          >
            {children}
          </UnifiedQueryProvider>
        </UnifiedWebPusherProvider>
      </body>
    </html>
  );
}
```

## 4. Component Using Real-time Data

```typescript
// components/post-feed.tsx
'use client';
import { usePostsByEventId } from '@groupi/hooks';

export function PostFeed({ eventId }: { eventId: string }) {
  // This hook automatically gets real-time updates
  // No manual pusher subscriptions needed!
  const { data, isLoading } = usePostsByEventId(eventId);

  if (isLoading || !data) {
    return <div>Loading posts...</div>;
  }

  const [error, posts] = data;

  if (error) {
    switch (error._tag) {
      case 'PostNotFoundError':
        return <div>No posts found</div>;
      default:
        return <div>Error loading posts</div>;
    }
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## 5. Real-time Message Flow

### When a post is created:

1. **Client** calls `createPost` mutation
2. **Server** creates post in database
3. **Server** calls `invalidatePostQueries(eventId, postId, 'post.created')`
4. **Pusher** sends message to all event members:
   ```json
   {
     "type": "post.created",
     "queryKeys": [
       ["post", "getByEventId"],
       ["post", "getById"]
     ],
     "data": { "eventId": "123", "postId": "456", "authorId": "789" }
   }
   ```
5. **All clients** receive message and invalidate matching queries
6. **Components** automatically refetch and update UI

## Benefits

✅ **Server-side rendering** - Fast initial loads, SEO-friendly  
✅ **Single query client** - Better caching, no conflicts  
✅ **Automatic real-time updates** - No manual channel management  
✅ **Type-safe invalidation** - Compile-time checked message types  
✅ **Scalable** - One channel per user, not per resource  
✅ **Cross-platform** - Same pattern works for web and mobile  
✅ **Graceful degradation** - Works without real-time if pusher fails

## Migration Path

1. ✅ Create unified providers and definitions
2. ✅ Add prefetching utilities
3. ✅ Create real-time invalidation helpers
4. 🔄 Update one page at a time to use new architecture
5. 🔄 Add invalidation calls to existing services
6. 🔄 Remove old query providers when migration complete

## Performance Considerations

- **Server prefetching** reduces client-side loading states
- **Single query client** eliminates duplicate requests
- **User-specific channels** scale better than resource-specific channels
- **Fire-and-forget invalidation** doesn't slow down mutations
- **Batch invalidation** efficiently handles complex updates
