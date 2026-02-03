import { Badge } from '@/components/ui/badge';
import { usePendingRequests } from '@/hooks/convex/use-friends';

/**
 * FriendRequestCount component
 * Displays a badge with the pending friend request count
 * Hides when count is 0
 * Updates in real-time via Convex
 */
export function FriendRequestCount() {
  const pendingRequests = usePendingRequests();
  const count = pendingRequests?.length ?? 0;

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

/**
 * Hook to get pending friend request count
 * Can be used to combine with other counts
 */
export function usePendingFriendRequestCount(): number {
  const pendingRequests = usePendingRequests();
  return pendingRequests?.length ?? 0;
}
