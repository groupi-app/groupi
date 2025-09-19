# Notification Migration: Server Actions → tRPC

## Migration Complete ✅

We've successfully migrated the notification hooks from server actions to tRPC! Here's how to use the new hooks in your components:

## Before (Server Actions)

```tsx
// ❌ Old way: Direct server action imports
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/lib/actions/notification';

function NotificationComponent() {
  const handleMarkAsRead = async (notificationId: string) => {
    const [error, result] = await markNotificationAsReadAction(notificationId);
    if (error) {
      // Handle error manually
      console.error(error);
    }
    // Manual cache invalidation needed
  };

  return (
    <button onClick={() => handleMarkAsRead(notificationId)}>
      Mark as Read
    </button>
  );
}
```

## After (tRPC)

```tsx
// ✅ New way: tRPC hooks
import {
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useNotifications,
} from '@groupi/hooks';

function NotificationComponent({ userId }: { userId: string }) {
  const { data: notifications, isLoading } = useNotifications(userId);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead(userId);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate({ notificationId });
    // ✅ Automatic optimistic updates
    // ✅ Automatic error handling
    // ✅ Automatic cache invalidation
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate({ userId });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleMarkAllAsRead}>Mark All as Read</button>
      {notifications?.map(notification => (
        <div key={notification.id}>
          <p>{notification.message}</p>
          <button onClick={() => handleMarkAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Key Benefits

1. **🔒 Type Safety**: End-to-end type safety from database to UI
2. **⚡ Optimistic Updates**: Instant UI feedback before server response
3. **🔄 Auto Cache Management**: React Query handles cache invalidation
4. **🛡️ Error Handling**: Built-in error handling and retry logic
5. **📦 Bundle Size**: Smaller bundle - no server action duplication

## Available Hooks

```tsx
// Queries
useNotifications(userId: string)
useUnreadNotificationCount(userId: string)

// Mutations
useMarkNotificationAsRead()
useMarkNotificationAsUnread()
useMarkAllNotificationsAsRead(userId: string)
useMarkEventNotifsAsRead()
useMarkPostNotifsAsRead()
useDeleteNotification()
useDeleteAllNotifications()
useCreateNotification()
useCreateEventNotifs()
useCreateEventModNotifs()
useCreatePostNotifs()
```

## Migration Checklist

- [x] ✅ Extended tRPC notification router with all procedures
- [x] ✅ Updated notification hooks to use tRPC
- [ ] 🚧 Update notification components to use hooks
- [ ] 📋 Migrate other domains (event, post, member, etc.)

## Next Steps

1. Update components that import server actions directly
2. Apply same pattern to other domains
3. Remove unused server action files
4. Update any remaining direct tRPC calls to use hooks

The notification domain is now fully tRPC-enabled! 🎉
