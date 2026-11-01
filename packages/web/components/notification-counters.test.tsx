import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCount } from './notification-count';
import { CombinedBadgeCount } from './combined-badge-count';
import { FriendRequestCount } from './friend-request-count';

const { notifications, requests } = vi.hoisted(() => ({
  notifications: vi.fn(),
  requests: vi.fn(),
}));
vi.mock('@/hooks/convex/use-notifications', () => ({
  useUnreadNotificationCount: notifications,
}));
vi.mock('@/hooks/convex/use-friends', () => ({
  usePendingRequests: requests,
}));

describe('navigation notification counters', () => {
  it('uses solid unread indicators for notifications and requests', () => {
    notifications.mockReturnValue({ count: 2 });
    requests.mockReturnValue([{}, {}, {}]);
    render(
      <>
        <NotificationCount />
        <FriendRequestCount />
        <CombinedBadgeCount />
      </>
    );
    for (const count of [2, 3, 5]) {
      expect(screen.getByLabelText(`${count} unread`)).toHaveAttribute(
        'data-slot',
        'unread-indicator'
      );
    }
  });

  it('hides empty counters and caps large counts without losing the accessible count', () => {
    notifications.mockReturnValue({ count: 0 });
    requests.mockReturnValue([]);
    const { rerender } = render(<NotificationCount />);
    expect(screen.queryByLabelText('0 unread')).not.toBeInTheDocument();
    notifications.mockReturnValue({ count: 130 });
    rerender(<NotificationCount />);
    expect(screen.getByLabelText('130 unread')).toHaveTextContent('99+');
  });
});
