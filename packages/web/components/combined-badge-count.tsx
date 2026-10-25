'use client';

import { UnreadIndicator } from '@/components/atoms/unread-indicator';
import { useUnreadNotificationCount } from '@/hooks/convex/use-notifications';
import { usePendingRequests } from '@/hooks/convex/use-friends';

interface CombinedBadgeCountProps {
  /**
   * Whether to include pending friend requests in the count.
   * Set to true for mobile (combined menu), false for desktop (separate menus).
   * @default true
   */
  includeFriendRequests?: boolean;
}

/**
 * CombinedBadgeCount component
 * Displays a badge with notification count, optionally including friend requests
 * Hides when total count is 0
 * Updates in real-time via Convex
 */
export function CombinedBadgeCount({
  includeFriendRequests = true,
}: CombinedBadgeCountProps) {
  const unreadCountData = useUnreadNotificationCount();
  const notificationCount = unreadCountData?.count ?? 0;

  const pendingRequests = usePendingRequests();
  const friendRequestCount = includeFriendRequests
    ? (pendingRequests?.length ?? 0)
    : 0;

  const totalCount = notificationCount + friendRequestCount;

  if (totalCount === 0) {
    return null;
  }

  return (
    <UnreadIndicator count={totalCount} className='absolute -top-1 -right-1' />
  );
}
