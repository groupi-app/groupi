# 🔄 Hook Pattern Comparison

## Before: Confusing Side-Effect Hooks

```tsx
// ❌ Multiple hooks for one thing, unclear what they return
function EventPage({ eventId }) {
  const wsProvider = usePusherProvider(); // Returns WebSocket provider
  const { data: event, isLoading } = useEvent(eventId); // Returns event data
  useEventRealTimeSync(wsProvider, eventId); // Returns nothing??? 😕

  // Questions:
  // - Is real-time working?
  // - Is WebSocket connected?
  // - What if I want to disable real-time?
  // - How do I show connection status to users?
}
```

## After: Natural Integrated Hooks

```tsx
// ✅ One hook returns everything you need
function EventPage({ eventId }) {
  const wsProvider = usePusherProvider();

  const {
    data: event,
    isLoading,
    realTime: {
      isConnected, // ✓ Know if WebSocket is connected
      isEnabled, // ✓ Know if real-time is enabled
    },
  } = useEvent(eventId, wsProvider); // One hook, clear returns

  const updateEvent = useUpdateEventDetails(wsProvider);

  return (
    <div>
      <h1>{event?.title}</h1>

      {/* ✓ Can show connection status */}
      {realTime.isConnected ? (
        <span className='text-green-600'>🟢 Live</span>
      ) : (
        <span className='text-gray-500'>🔴 Offline</span>
      )}

      <button
        onClick={() => updateEvent.mutate({ eventId, title: 'New Title' })}
        disabled={updateEvent.isLoading}
      >
        {updateEvent.isLoading ? 'Saving...' : 'Update'}
      </button>

      {/* ✓ Know if changes will sync with others */}
      {updateEvent.realTime.willSyncWithOthers && (
        <small>Changes sync in real-time with other users</small>
      )}
    </div>
  );
}
```

## Key Benefits

### 1. **Returns Useful Information**

```tsx
const { data, isLoading, realTime } = useEvent(eventId, wsProvider);
//     ^^^^ ^^^^^^^^^ ^^^^^^^^
//     Standard query data + Real-time status
```

### 2. **Optional Real-Time**

```tsx
// Real-time enabled
const result = useEvent(eventId, wsProvider);

// Real-time disabled (offline mode)
const result = useEvent(eventId, null);
```

### 3. **Cross-Platform Ready**

```tsx
// Web
const wsProvider = usePusherProvider();
const result = useEvent(eventId, wsProvider);

// React Native - SAME HOOK!
const wsProvider = useReactNativeWebSocketProvider(WS_URL);
const result = useEvent(eventId, wsProvider);
```

### 4. **Testable**

```tsx
// Test with real-time
const result = useEvent(eventId, mockWebSocketProvider);

// Test offline mode
const result = useEvent(eventId, null);
```

## Usage Examples

### Simple Web Usage

```tsx
import { useEvent, usePusherProvider } from '@groupi/hooks';

function EventCard({ eventId }) {
  const wsProvider = usePusherProvider();
  const { data: event, realTime } = useEvent(eventId, wsProvider);

  return (
    <div>
      <h3>{event?.title}</h3>
      {realTime.isConnected && <span>🔴 LIVE</span>}
    </div>
  );
}
```

### React Native Usage (Identical!)

```tsx
import { useEvent, useReactNativeWebSocketProvider } from '@groupi/hooks';

function EventCard({ eventId }) {
  const wsProvider = useReactNativeWebSocketProvider('wss://api.app.com/ws');
  const { data: event, realTime } = useEvent(eventId, wsProvider);

  return (
    <View>
      <Text>{event?.title}</Text>
      {realTime.isConnected && <Text>🔴 LIVE</Text>}
    </View>
  );
}
```

### Conditional Real-Time

```tsx
function EventEditor({ eventId, enableRealTime }) {
  const wsProvider = enableRealTime ? usePusherProvider() : null;
  const { data: event, realTime } = useEvent(eventId, wsProvider);

  return (
    <div>
      <h1>{event?.title}</h1>

      <label>
        <input
          type='checkbox'
          checked={realTime.isEnabled}
          // Toggle real-time on/off
        />
        Real-time sync
      </label>
    </div>
  );
}
```

## Summary

| Aspect          | Side-Effect Hooks     | Integrated Hooks        |
| --------------- | --------------------- | ----------------------- |
| **Returns**     | Nothing (confusing)   | Data + status (clear)   |
| **Usage**       | Multiple hooks needed | Single hook             |
| **Status**      | Unknown               | Connection, sync status |
| **Testing**     | Hard to mock          | Easy with null provider |
| **Platform**    | Need different hooks  | Same hook everywhere    |
| **Flexibility** | Always on/off         | Conditional real-time   |

The integrated approach feels much more like natural React hooks! 🎣
