import { Badge } from '@/components/ui/badge';
import { useUnreadNotificationCount } from '@/hooks/convex/use-notifications';

/**
 * NotificationCount component
 * Displays a badge with the unread notification count
 * Hides when count is 0
 * Updates in real-time via Convex
 */
export function NotificationCount() {
  // Use Convex hook for real-time unread count
  const unreadCountData = useUnreadNotificationCount();
  const count = unreadCountData?.count ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <Badge
      variant='destructive'
      className='absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs'
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
