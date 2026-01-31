# Presence System Rules

Rules for working with the real-time presence system in Groupi.

## Table of Contents

- [Overview](#overview)
- [File Locations](#file-locations)
- [Hook Selection Guide](#hook-selection-guide)
- [Implementation Rules](#implementation-rules)
- [Performance Rules](#performance-rules)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

## Overview

The presence system provides:

1. **App-level presence**: Who's online in the app
2. **Room-level presence**: Who's viewing specific content
3. **Typing indicators**: Real-time typing status

**Key principle**: Always use global user context hooks (`useCurrentUser*`) instead of manually extracting personId.

## File Locations

| File                                                   | Purpose                          |
| ------------------------------------------------------ | -------------------------------- |
| `packages/web/hooks/convex/use-presence.ts`            | All presence hooks               |
| `packages/web/hooks/convex/use-local-online-status.ts` | Local status computation         |
| `packages/web/providers/visibility-provider.tsx`       | Tab visibility and idle tracking |
| `packages/web/context/global-user-context.tsx`         | Current user data                |
| `packages/web/components/global-presence-tracker.tsx`  | App-level presence component     |

## Hook Selection Guide

### For Post/Thread Presence

```typescript
// ALWAYS USE: Context-aware hooks (recommended)
import {
  useCurrentUserPostPresence,
  useCurrentUserTypingState,
} from '@/hooks/convex/use-presence';

const { roomToken } = useCurrentUserPostPresence(postId);
const { setTyping } = useCurrentUserTypingState(postId);
```

```typescript
// AVOID: Manual personId extraction
import {
  usePostPresenceWithToken,
  useTypingState,
} from '@/hooks/convex/use-presence';

const personId = userMembership?.personId; // Don't do this
const { roomToken } = usePostPresenceWithToken(postId, personId);
```

### For Reading Typing Users

```typescript
import { useTypingIndicators } from '@/hooks/convex/use-presence';
import { useGlobalUser } from '@/context/global-user-context';

// Get roomToken from presence hook
const { roomToken } = useCurrentUserPostPresence(postId);

// Get current user for filtering
const { person } = useGlobalUser();
const currentPersonId = person?.id as Id<'persons'> | undefined;

// Get typing users, filter out current user
const allTypingUsers = useTypingIndicators(roomToken ?? undefined);
const typingUsers = useMemo(
  () => allTypingUsers.filter(u => u.personId !== currentPersonId),
  [allTypingUsers, currentPersonId]
);
```

### For Online Status Display

```typescript
import { useLocalOnlineStatus } from '@/hooks/convex/use-local-online-status';

// Compute status locally without network requests
const usersWithStatus = useLocalOnlineStatus(users);
```

## Implementation Rules

### Rule 1: Use Context-Aware Hooks

**ALWAYS** use `useCurrentUserPostPresence` and `useCurrentUserTypingState` for post-level presence.

```typescript
// ✅ Correct
const { roomToken } = useCurrentUserPostPresence(postId);
const { setTyping } = useCurrentUserTypingState(postId);

// ❌ Wrong - manual personId extraction
const personId = userMembership?.personId as Id<'persons'>;
const { roomToken } = usePostPresenceWithToken(postId, personId);
```

### Rule 2: Clear Typing on Unmount

**ALWAYS** clear typing state when a component unmounts.

```typescript
const { setTyping } = useCurrentUserTypingState(postId);

// ✅ Correct - cleanup on unmount
useEffect(() => {
  return () => setTyping(false);
}, [setTyping]);

// ❌ Wrong - no cleanup, user appears to type forever
```

### Rule 3: Clear Typing on Submit

**ALWAYS** clear typing state when form is submitted.

```typescript
async function onSubmit(values) {
  setTyping(false); // Clear immediately
  await submitReply(values);
}
```

### Rule 4: Filter Out Current User from Typing Indicators

**ALWAYS** filter the current user from typing indicators display.

```typescript
const { person } = useGlobalUser();
const personId = person?.id as Id<'persons'> | undefined;

const allTypingUsers = useTypingIndicators(roomToken ?? undefined);
const typingUsers = useMemo(
  () => allTypingUsers.filter(u => u.personId !== personId),
  [allTypingUsers, personId]
);
```

### Rule 5: Use Local Status Computation for Lists

**ALWAYS** use `useLocalOnlineStatus` when displaying online status in user lists.

```typescript
// ✅ Correct - no network requests, updates every 10s
const usersWithStatus = useLocalOnlineStatus(users);

// ❌ Wrong - causes network requests on every interval
useEffect(() => {
  const interval = setInterval(() => refetchUsers(), 10000);
  return () => clearInterval(interval);
}, []);
```

### Rule 6: One Presence Hook Per Room Per User

**NEVER** mount multiple presence hooks for the same room.

```typescript
// ❌ Wrong - duplicate presence sessions
function ParentComponent({ postId }) {
  useCurrentUserPostPresence(postId); // First hook
  return <ChildComponent postId={postId} />;
}

function ChildComponent({ postId }) {
  useCurrentUserPostPresence(postId); // Duplicate!
}

// ✅ Correct - presence at parent, pass roomToken down
function ParentComponent({ postId }) {
  const { roomToken } = useCurrentUserPostPresence(postId);
  return <ChildComponent roomToken={roomToken} />;
}
```

## Performance Rules

### Rule 7: Never Modify Timing Constants Without Reason

Current optimized values:

| Constant           | Value | Impact                             |
| ------------------ | ----- | ---------------------------------- |
| Heartbeat interval | 30s   | 3x reduction vs 10s default        |
| Typing debounce    | 300ms | ~90% mutation reduction            |
| Idle timeout       | 5 min | Pauses presence for inactive users |

### Rule 8: Rely on Visibility Provider

Presence hooks automatically pause when:

- Tab is hidden (user switched tabs)
- User is idle for 5+ minutes
- personId is undefined

**NEVER** add manual visibility checks in components.

```typescript
// ❌ Wrong - manual visibility handling
const isVisible = useIsVisible();
if (isVisible) {
  // track presence
}

// ✅ Correct - hooks handle this automatically
const { roomToken } = useCurrentUserPostPresence(postId);
```

### Rule 9: Debouncing is Built-in for Typing

**NEVER** add additional debouncing to typing state.

```typescript
// ❌ Wrong - double debouncing
const debouncedSetTyping = useDebouncedCallback(setTyping, 300);

// ✅ Correct - setTyping already debounces internally
const { setTyping } = useCurrentUserTypingState(postId);
setTyping(hasContent); // 300ms debounce built-in
```

## Common Patterns

### Pattern: Reply Form with Typing

```typescript
function ReplyForm({ postId }: { postId: Id<'posts'> }) {
  const { setTyping } = useCurrentUserTypingState(postId);

  const handleChange = useCallback((value: string) => {
    const hasContent = value.trim().length > 0;
    setTyping(hasContent);
  }, [setTyping]);

  useEffect(() => {
    return () => setTyping(false);
  }, [setTyping]);

  return <Editor onChange={handleChange} />;
}
```

### Pattern: Replies Section with Typing Indicators

```typescript
function RepliesSection({ postId }: { postId: Id<'posts'> }) {
  const { person } = useGlobalUser();
  const personId = person?.id as Id<'persons'> | undefined;

  const { roomToken } = useCurrentUserPostPresence(postId);

  const allTypingUsers = useTypingIndicators(roomToken ?? undefined);
  const typingUsers = useMemo(
    () => allTypingUsers.filter(u => u.personId !== personId),
    [allTypingUsers, personId]
  );

  return (
    <>
      <ReplyList postId={postId} />
      <TypingIndicator typingUsers={typingUsers} />
      <ReplyForm postId={postId} />
    </>
  );
}
```

### Pattern: Online User Badge

```typescript
function UserAvatar({ user }: { user: UserWithHeartbeat }) {
  const isOnline = computeOnlineStatus(user.lastHeartbeat);

  return (
    <div className="relative">
      <Avatar src={user.image} />
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500" />
      )}
    </div>
  );
}
```

## Anti-Patterns

### Anti-Pattern 1: Extracting personId from Props

```typescript
// ❌ NEVER do this
const personId = userMembership?.personId as Id<'persons'>;
const { roomToken } = usePostPresenceWithToken(postId, personId);

// ✅ Use context-aware hooks
const { roomToken } = useCurrentUserPostPresence(postId);
```

### Anti-Pattern 2: Multiple Presence Hooks in Same Component Tree

```typescript
// ❌ Creates duplicate sessions
function PostPage({ postId }) {
  usePostPresence(postId, personId); // Here
  return <RepliesSection postId={postId} />; // And again inside
}
```

### Anti-Pattern 3: Missing Typing Cleanup

```typescript
// ❌ User will appear to type until timeout (5s)
function ReplyForm({ postId }) {
  const { setTyping } = useCurrentUserTypingState(postId);
  return <Editor onChange={(v) => setTyping(v.length > 0)} />;
}

// ✅ Always cleanup
function ReplyForm({ postId }) {
  const { setTyping } = useCurrentUserTypingState(postId);

  useEffect(() => {
    return () => setTyping(false);
  }, [setTyping]);

  return <Editor onChange={(v) => setTyping(v.length > 0)} />;
}
```

### Anti-Pattern 4: Polling for Online Status

```typescript
// ❌ Network requests every 10 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const users = await fetchUsers();
    setUsersWithStatus(users);
  }, 10000);
  return () => clearInterval(interval);
}, []);

// ✅ Local computation, no network requests
const usersWithStatus = useLocalOnlineStatus(users);
```

### Anti-Pattern 5: Ignoring roomToken for Typing

```typescript
// ❌ Won't work - typing requires roomToken
function ReplyForm({ postId }) {
  const { setTyping } = useCurrentUserTypingState(postId);
  // No presence hook = no roomToken = typing not visible to others
}

// ✅ Must have presence hook in component tree
function RepliesSection({ postId }) {
  const { roomToken } = useCurrentUserPostPresence(postId); // This creates session
  return <ReplyForm postId={postId} />; // Typing works now
}
```
