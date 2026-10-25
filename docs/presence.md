# Presence System Documentation

Web presence hooks show online status, room viewers, and typing indicators. The
backend derives write identity from the authenticated session and checks access
to event and post rooms; client-supplied person IDs do not authorize another identity.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Hooks Reference](#hooks-reference)
- [Optimization Strategies](#optimization-strategies)
- [Implementation Patterns](#implementation-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The presence system provides three core capabilities:

1. **App-level presence**: Track which users are online in the application
2. **Room-level presence**: Track who's viewing specific content (posts, threads)
3. **Typing indicators**: Show when users are typing in real-time

### Key Technologies

- **@convex-dev/presence**: Convex presence component for heartbeat-based tracking
- **VisibilityProvider**: Pauses heartbeats after the hidden-tab grace period or idle timeout
- **GlobalUserProvider**: Provides current user context to presence hooks

## Architecture

### Component Hierarchy

```text
ThemeProvider
└── ConvexClientProvider
    └── VisibilityProvider          ← Tracks tab visibility and idle state
        └── GlobalUserProvider      ← Provides current user data
            └── GlobalPresenceTracker   ← App-level presence (auto-runs)
            └── App Components
                └── RepliesSection  ← Post-level presence + typing
```

### Data Flow

```text
User Activity → VisibilityProvider (pause signals) → Presence Hooks → Convex Backend
                                                        ↓
                                                 Other Clients ← Real-time Subscriptions
```

### Room ID Conventions

| Context     | Room ID Format      | Example          |
| ----------- | ------------------- | ---------------- |
| App-wide    | `"app"`             | `"app"`          |
| Post/Thread | `"post:{postId}"`   | `"post:abc123"`  |
| Event       | `"event:{eventId}"` | `"event:abc123"` |

## Quick Start

### 1. App-Level Presence (Already Configured)

App-level presence is automatically handled by `GlobalPresenceTracker` in the root layout. No additional setup needed.

```tsx
// Already in app/layout.tsx - DO NOT duplicate
<GlobalPresenceTracker />
```

### 2. Post-Level Presence with Typing Indicators

```tsx
import {
  useCurrentUserPostPresence,
  useCurrentUserTypingState,
  useTypingIndicators,
} from '@/hooks/convex/use-presence';

function ThreadComponent({ postId }: { postId: Id<'posts'> }) {
  // Track presence and get roomToken for typing indicators
  const { roomToken } = useCurrentUserPostPresence(postId);

  // Get list of users currently typing (excludes current user)
  const typingUsers = useTypingIndicators(roomToken ?? undefined);

  return (
    <div>
      {/* Thread content */}
      <TypingIndicator typingUsers={typingUsers} />
      <ReplyForm postId={postId} />
    </div>
  );
}

function ReplyForm({ postId }: { postId: Id<'posts'> }) {
  // Manage typing state with automatic debouncing
  const { setTyping } = useCurrentUserTypingState(postId);

  return (
    <input
      onChange={e => setTyping(e.target.value.length > 0)}
      onBlur={() => setTyping(false)}
    />
  );
}
```

## Hooks Reference

### App-Level Presence

#### `useAppPresence(personId)`

Tracks user's global online status in the app.

```tsx
function useAppPresence(personId: Id<'persons'> | undefined): void;
```

- **Used by**: `GlobalPresenceTracker` (automatically)
- **Heartbeat interval**: 30 seconds
- **Offline threshold**: 60 seconds (2x interval)
- **Pauses when**: Tab hidden for 30 seconds or user idle for 5 minutes; the
  provider also tracks extended inactivity at 15 minutes

### Post-Level Presence

#### `useCurrentUserPostPresence(postId)` (Recommended)

Tracks presence in a post using global user context. Returns `roomToken` needed for typing indicators.

```tsx
function useCurrentUserPostPresence(postId: Id<'posts'> | undefined): {
  roomToken: string | null;
  isTracking: boolean;
};
```

#### `usePostPresenceWithToken(postId, personId)`

Lower-level hook receiving the current person ID for client-side tracking. The
server derives the acting person from the session and does not trust this argument
as an alternate identity.

```tsx
function usePostPresenceWithToken(
  postId: Id<'posts'> | undefined,
  personId: Id<'persons'> | undefined
): {
  roomToken: string | null;
  isTracking: boolean;
};
```

#### `usePostPresence(postId, personId)`

Simple presence tracking without roomToken (can't use typing indicators).

```tsx
function usePostPresence(
  postId: Id<'posts'> | undefined,
  personId: Id<'persons'> | undefined
): {
  presenceState: PresenceState;
  isTracking: boolean;
};
```

#### `usePostViewers(postId)`

Get list of users currently viewing a post (read-only, no heartbeats).

```tsx
function usePostViewers(postId: Id<'posts'> | undefined): PresenceUser[];
```

### Typing Indicators

#### `useCurrentUserTypingState(postId)` (Recommended)

Manages typing state for the current user with automatic debouncing.

```tsx
function useCurrentUserTypingState(postId: Id<'posts'> | undefined): {
  setTyping: (isTyping: boolean) => void;
};
```

**Features:**

- Debounces "start typing" by 300ms
- Immediately clears "stop typing" for responsive UX
- Auto-clears after 5 seconds of no updates

#### `useTypingState(postId, personId)`

Lower-level hook receiving the current person ID for client-side tracking. The
server derives the acting person from the session and does not trust this argument
as an alternate identity.

#### `useTypingIndicators(roomToken)`

Gets list of users currently typing in a room.

```tsx
function useTypingIndicators(roomToken: string | undefined): TypingUser[];
```

**Returns:**

```tsx
interface TypingUser {
  personId: Id<'persons'>;
  name: string;
  image?: string;
}
```

### Local Online Status Calculation

#### `useLocalOnlineStatus(presenceData, offlineThreshold?, refreshInterval?)`

Computes online status locally without network requests.

```tsx
function useLocalOnlineStatus<T extends { lastHeartbeat?: number }>(
  presenceData: T[] | undefined,
  offlineThreshold = 60000, // 60 seconds
  refreshInterval = 10000 // 10 seconds
): (T & { isOnline: boolean })[];
```

**Use case**: Showing online status in a user list without re-fetching data.

```tsx
const usersWithStatus = useLocalOnlineStatus(users);

return usersWithStatus.map(user => (
  <div key={user.id}>
    {user.name}
    {user.isOnline && <OnlineBadge />}
  </div>
));
```

#### `computeOnlineStatus(lastHeartbeat, offlineThreshold?)`

One-off calculation for a single user.

```tsx
function computeOnlineStatus(
  lastHeartbeat: number | undefined,
  offlineThreshold = 60000
): boolean;
```

### Visibility State

#### `useIsActive()`

Returns `true` when app should be active (tab visible AND user not idle).

```tsx
const isActive = useIsActive();

useEffect(() => {
  if (!isActive) {
    // Pause expensive operations
  }
}, [isActive]);
```

#### `useVisibility()`

Full visibility context with all state.

```tsx
interface VisibilityContextValue {
  isVisible: boolean;
  isFocused: boolean;
  isAway: boolean; // Idle for 5 minutes
  isOffline: boolean; // Inactive for 15 minutes
  isActive: boolean; // Visible and not away
  shouldPauseQueries: boolean; // Away or hidden past grace period
  shouldPauseHeartbeats: boolean;
  resetIdleTimer: () => void;
  lastActivityTime: number;
}
```

## Optimization Strategies

### 1. Heartbeat Interval Tuning

The web hooks use these timing defaults:

| Setting             | Value  | Reason                                        |
| ------------------- | ------ | --------------------------------------------- |
| Heartbeat interval  | 30s    | Reduced from 10s default                      |
| Offline threshold   | 60s    | 2x heartbeat interval                         |
| Idle timeout        | 5 min  | User considered "away"                        |
| Hidden-tab grace    | 30s    | Heartbeats continue during short tab switches |
| Extended inactivity | 15 min | Provider marks the user offline               |

### 2. Debounced Typing Indicators

The typing system debounces mutations to reduce database writes:

| Event        | Behavior  | Delay     |
| ------------ | --------- | --------- |
| Start typing | Debounced | 300ms     |
| Stop typing  | Immediate | 0ms       |
| Auto-clear   | Automatic | 5 seconds |

### 3. Visibility-Based Pausing

Presence heartbeats use `shouldPauseHeartbeats`: a hidden tab has a 30-second
grace period before pausing; five minutes of inactivity also pauses heartbeats.
`useAppPresence` additionally checks the provider's 15-minute offline state.
Typing updates have their own debounce and timeout. For a custom heartbeat client,
use the same pause signal:

```tsx
const shouldPauseHeartbeats = useShouldPauseHeartbeats();
const isEnabled = !!postId && !!personId && !shouldPauseHeartbeats;

// No heartbeats when isEnabled is false
usePresence(api, roomId, userId, isEnabled ? interval : 0);
```

### 4. Local Status Computation

Instead of re-fetching to check if users went offline, compute locally:

```tsx
// Compute status locally from a permitted presence query result.
const usersWithStatus = useLocalOnlineStatus(cachedUsers); // No network
```

## Implementation Patterns

### Pattern 1: Thread with Typing Indicators

Complete example for a post thread:

```tsx
// RepliesSection.tsx
export function RepliesSection({ postId }: { postId: Id<'posts'> }) {
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;

  // Track presence and get roomToken
  const { roomToken } = useCurrentUserPostPresence(postId);

  // Get typing users, excluding current user
  const allTypingUsers = useTypingIndicators(roomToken ?? undefined);
  const typingUsers = useMemo(
    () => allTypingUsers.filter(u => u.personId !== personId),
    [allTypingUsers, personId]
  );

  return (
    <div>
      <ReplyList postId={postId} />
      <TypingIndicator typingUsers={typingUsers} />
      <ReplyForm postId={postId} />
    </div>
  );
}

// ReplyForm.tsx
export function ReplyForm({ postId }: { postId: Id<'posts'> }) {
  const { setTyping } = useCurrentUserTypingState(postId);

  const handleChange = useCallback(
    (value: string) => {
      const hasContent = value.trim().length > 0;
      setTyping(hasContent);
    },
    [setTyping]
  );

  // Clear typing on unmount
  useEffect(() => {
    return () => setTyping(false);
  }, [setTyping]);

  return <Editor onChange={handleChange} onSubmit={() => setTyping(false)} />;
}
```

### Pattern 2: Online User List

Showing online status without constant re-fetching:

```tsx
function OnlineUserList({
  users,
}: {
  users: { id: string; name: string; lastHeartbeat?: number }[];
}) {
  // Compute online status locally, refreshes every 10s
  const usersWithStatus = useLocalOnlineStatus(users);

  return (
    <ul>
      {usersWithStatus.map(user => (
        <li key={user.id}>
          <span
            className={
              user.isOnline ? 'text-text-success' : 'text-muted-foreground'
            }
          >
            {user.isOnline ? '●' : '○'}
          </span>
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

### Pattern 3: Custom Room Presence

For event pages, use an `event:{eventId}` room. The server accepts only known room
formats and checks current event membership for event and post room writes:

```tsx
function EventPresence({ eventId }: { eventId: Id<'events'> }) {
  const { person } = useGlobalUser();
  const personId = person?._id;
  const shouldPauseHeartbeats = useShouldPauseHeartbeats();

  // Event-scoped rooms require current event membership on the server.
  const roomId = `event:${eventId}`;
  const isEnabled = !!personId && !shouldPauseHeartbeats;

  // Use the underlying presence hook directly
  const presenceState = usePresence(
    presenceApi,
    roomId,
    personId ?? '',
    isEnabled ? 30000 : 0
  );

  return <ViewerCount count={presenceState?.length ?? 0} />;
}
```

## Troubleshooting

### Typing Indicator Not Showing

1. **Check roomToken**: Ensure `useCurrentUserPostPresence` returns a valid `roomToken`
2. **Check filtering**: Make sure you're not filtering out all users
3. **Check debounce**: First keystroke has 300ms delay

### Presence Not Updating

1. **Check pause signals**: The tab may be hidden past the grace period or the user may be idle
2. **Check personId**: Must be a valid `Id<'persons'>`
3. **Check GlobalUserProvider**: Must be mounted above presence hooks

### High Function Call Volume

1. **Check heartbeat interval**: Should be 30s, not 10s
2. **Check typing debounce**: Should be 300ms
3. **Check idle timeout**: Users should go "away" after 5 minutes
4. **Check duplicate hooks**: Only one presence hook per room per user

### Memory Leaks

1. **Clear typing on unmount**: Always call `setTyping(false)` in cleanup
2. **Check interval cleanup**: All intervals should be cleared on unmount

## Quick Reference

| Hook                         | Purpose                   | Auto-Context |
| ---------------------------- | ------------------------- | ------------ |
| `useAppPresence`             | Global online status      | No           |
| `useCurrentUserPostPresence` | Post presence + roomToken | Yes          |
| `useCurrentUserTypingState`  | Typing state management   | Yes          |
| `useTypingIndicators`        | Get typing users          | N/A          |
| `usePostViewers`             | Get users viewing post    | N/A          |
| `useLocalOnlineStatus`       | Local status computation  | N/A          |
| `useIsActive`                | Check if app is active    | N/A          |

### Timing Constants

| Constant             | Value  | Location                     |
| -------------------- | ------ | ---------------------------- |
| Heartbeat interval   | 30s    | `use-presence.ts`            |
| Offline threshold    | 60s    | 2x heartbeat                 |
| Typing debounce      | 300ms  | `use-presence.ts`            |
| Typing auto-clear    | 5s     | `use-presence.ts`            |
| Idle timeout         | 5 min  | `visibility-provider.tsx`    |
| Hidden-tab grace     | 30s    | `visibility-provider.tsx`    |
| Extended inactivity  | 15 min | `visibility-provider.tsx`    |
| Local status refresh | 10s    | `use-local-online-status.ts` |
