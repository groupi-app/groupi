# 🎣 Improved Hook Patterns: Natural React Hook Design

## The Problem with Side-Effect Only Hooks

The original real-time sync hooks felt unnatural because they didn't return anything:

```tsx
// ❓ Confusing - what does this hook do? What does it return?
const wsProvider = usePusherProvider();
const { data: event } = useEvent(eventId);
useEventRealTimeSync(wsProvider, eventId); // Returns nothing, pure side effect
```

This pattern works but feels weird because most React hooks return something useful.

## Solution: Integrated Hooks That Return Status

### Before: Separate Hooks

```tsx
// Old pattern - multiple hooks for one piece of data
const wsProvider = usePusherProvider();
const { data: event, isLoading } = useEvent(eventId);
useEventRealTimeSync(wsProvider, eventId); // Side effect only

// No way to know:
// - Is real-time sync working?
// - Did the WebSocket connect?
// - Will other users see my changes?
```

### After: Integrated Hooks

```tsx
// New pattern - one hook with everything you need
const {
  data: event,
  isLoading,
  realTime: { isConnected, isEnabled },
} = useEvent(eventId, wsProvider);

// Now you can:
// - See real-time connection status
// - Show UI indicators for sync status
// - Handle offline/online states
```

## Improved Hook Patterns

### 1. Data Hooks with Built-in Real-Time

```tsx
export function useEvent(
  eventId: string,
  wsProvider?: WebSocketProvider | null
) {
  // Standard tRPC query
  const query = api.event.getById.useQuery(
    { eventId },
    {
      /* config */
    }
  );

  // Built-in real-time sync (optional)
  useRealTimeSync(wsProvider || null, {
    channel: `event__${eventId}`,
    event: 'update_event_data',
    queryPredicate: query => query.queryKey[0] === 'event',
  });

  return {
    // Standard query data
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Real-time status - this is what was missing!
    realTime: {
      isConnected: !!wsProvider,
      isEnabled: !!wsProvider,
    },
  };
}
```

### 2. Mutation Hooks with Sync Status

```tsx
export function useUpdateEventDetails(wsProvider?: WebSocketProvider | null) {
  const mutation = api.event.updateDetails.useMutation({
    // ... optimistic updates and error handling
  });

  return {
    // Standard mutation methods
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,

    // Real-time status information
    realTime: {
      isConnected: !!wsProvider,
      hasOptimisticUpdates: true,
      willSyncWithOthers: !!wsProvider, // Will other clients see this change?
    },
  };
}
```

## Usage Patterns

### Basic Usage (Feels Natural)

```tsx
function EventPage({ eventId }) {
  const wsProvider = usePusherProvider();

  const { data: event, isLoading, realTime } = useEvent(eventId, wsProvider);

  const updateEvent = useUpdateEventDetails(wsProvider);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{event.title}</h1>

      {/* Real-time status indicator */}
      <ConnectionStatus
        isConnected={realTime.isConnected}
        isEnabled={realTime.isEnabled}
      />

      <button
        onClick={() =>
          updateEvent.mutate({
            eventId,
            title: 'Updated Title',
          })
        }
        disabled={updateEvent.isLoading}
      >
        {updateEvent.isLoading ? 'Updating...' : 'Update Event'}
      </button>

      {/* Show if changes will sync with other users */}
      {updateEvent.realTime.willSyncWithOthers && (
        <span className='text-green-600'>
          ✓ Changes sync with other users in real-time
        </span>
      )}
    </div>
  );
}
```

### Connection Status Component

```tsx
function ConnectionStatus({ isConnected, isEnabled }) {
  if (!isEnabled) {
    return (
      <div className='flex items-center gap-2 text-gray-500'>
        <div className='w-2 h-2 bg-gray-400 rounded-full' />
        <span>Offline mode</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className='flex items-center gap-2 text-green-600'>
        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
        <span>Real-time sync active</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2 text-yellow-600'>
      <div className='w-2 h-2 bg-yellow-500 rounded-full' />
      <span>Connecting...</span>
    </div>
  );
}
```

### Platform-Specific Convenience Hooks

For even simpler usage, you can create platform-specific hooks:

```tsx
// Web-specific hook (auto-includes Pusher)
export function useEventWeb(eventId: string) {
  const wsProvider = usePusherProvider();
  return useEvent(eventId, wsProvider);
}

// React Native-specific hook (auto-includes WebSocket)
export function useEventMobile(eventId: string) {
  const wsProvider = useReactNativeWebSocketProvider(WS_URL);
  return useEvent(eventId, wsProvider);
}

// Usage becomes even simpler:
const { data: event, realTime } = useEventWeb(eventId); // Web
const { data: event, realTime } = useEventMobile(eventId); // React Native
```

## Advanced Patterns

### Conditional Real-Time Sync

```tsx
function EventEditor({ eventId, enableRealTime = true }) {
  const wsProvider = enableRealTime ? usePusherProvider() : null;

  const { data: event, realTime } = useEvent(eventId, wsProvider);

  // User can toggle real-time sync on/off
  return (
    <div>
      <h1>{event.title}</h1>

      <label>
        <input
          type='checkbox'
          checked={realTime.isEnabled}
          onChange={() => {
            /* toggle real-time */
          }}
        />
        Enable real-time sync
      </label>
    </div>
  );
}
```

### Bulk Operations with Sync Status

```tsx
function useUpdateMultipleEvents(wsProvider?: WebSocketProvider | null) {
  const [operations, setOperations] = useState([]);

  const updateEvent = useUpdateEventDetails(wsProvider);

  const updateMultiple = async events => {
    const results = [];

    for (const event of events) {
      const result = await updateEvent.mutateAsync(event);
      results.push(result);
    }

    return results;
  };

  return {
    updateMultiple,
    isLoading: updateEvent.isLoading,
    realTime: {
      ...updateEvent.realTime,
      batchWillSync: updateEvent.realTime.willSyncWithOthers,
    },
  };
}
```

## Benefits of This Approach

### 1. **Natural React Hook Feel**

- Hooks return useful data like users expect
- Status information is available for UI decisions
- Follows React conventions

### 2. **Better Developer Experience**

- Clear understanding of what each hook provides
- Real-time status for debugging and UI feedback
- Consistent patterns across all hooks

### 3. **Flexibility**

- Real-time sync is optional (pass `null` for wsProvider)
- Can conditionally enable/disable real-time features
- Easy to show connection status to users

### 4. **Testability**

- Can test with mock WebSocket providers
- Can test offline scenarios by passing `null`
- Real-time status helps with integration testing

## Migration from Side-Effect Hooks

### Before

```tsx
const wsProvider = usePusherProvider();
const { data: event } = useEvent(eventId);
useEventRealTimeSync(wsProvider, eventId); // ❌ Side effect only
```

### After

```tsx
const wsProvider = usePusherProvider();
const { data: event, realTime } = useEvent(eventId, wsProvider); // ✅ Returns useful status
```

The improved pattern maintains all the same functionality while providing better developer experience and more useful return values that feel natural in React applications! 🎉
