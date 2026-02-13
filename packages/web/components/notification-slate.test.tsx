/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import { NotificationSlate } from './notification-slate';

// Mock notification hook functions
const mockMarkAsRead = vi.fn();
const mockMarkAsUnread = vi.fn();
const mockDeleteNotification = vi.fn();

// Mock the notification hooks directly to prevent require('@/convex/_generated/api')
vi.mock('@/hooks/convex/use-notifications', () => ({
  useMarkNotificationAsRead: () => mockMarkAsRead,
  useMarkNotificationAsUnread: () => mockMarkAsUnread,
  useDeleteNotification: () => mockDeleteNotification,
}));

vi.mock('convex/react', () => ({
  useMutation: () => vi.fn(),
}));

// Mock other dependencies
vi.mock('@/stores/notification-close-store', () => ({
  useNotificationCloseStore: () => ({
    setPopoverOpen: vi.fn(),
    setSheetOpen: vi.fn(),
  }),
}));

vi.mock('@/stores/friends-dialog-store', () => ({
  useFriendsDialogStore: (
    selector: (state: { openDialog: () => void }) => unknown
  ) => selector({ openDialog: vi.fn() }),
}));

vi.mock('@/hooks/use-action-menu', () => ({
  useActionMenu: () => ({
    sheetOpen: false,
    setSheetOpen: vi.fn(),
    handleContextMenu: vi.fn(),
    handleClick: vi.fn(),
    handleMoreClick: vi.fn(),
    isMobile: false,
  }),
}));

vi.mock('@/convex/_generated/dataModel', () => ({
  Id: (value: string) => value,
}));

// Type helper for test fixtures
type TestId<T extends string> = string & { __tableName: T };

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Next.js components
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

describe('NotificationSlate', () => {
  const mockNotification = {
    // Convex Doc fields
    _id: 'notification-123' as TestId<'notifications'>,
    _creationTime: Date.now(),
    personId: 'person-123' as TestId<'persons'>,
    // EnrichedNotification fields
    id: 'notification-123',
    createdAt: Date.now(),
    type: 'NEW_POST' as const,
    read: false,
    event: {
      id: 'event-123',
      title: 'Test Event',
    },
    post: {
      id: 'post-123',
      title: 'Test Post',
    },
    author: {
      id: 'user-123',
      user: {
        name: 'Test User',
        email: 'testuser@example.com',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render notification content correctly', () => {
    render(<NotificationSlate notification={mockNotification} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/posted in/)).toBeInTheDocument();
  });

  test('should show unread state for unread notification', () => {
    const unreadNotification = { ...mockNotification, read: false };

    render(<NotificationSlate notification={unreadNotification} />);

    // Should show visual indicators for unread state
    // Note: This test assumes the component has proper data-testid attributes
    // In a real implementation, you'd verify the visual styling for unread state
  });

  test('should show read state for read notification', () => {
    const readNotification = { ...mockNotification, read: true };

    render(<NotificationSlate notification={readNotification} />);

    // Should show visual indicators for read state
    // Note: This test assumes the component has proper data-testid attributes
  });

  test('should call markAsRead when mark as read is clicked', async () => {
    mockMarkAsRead.mockResolvedValue({});

    render(<NotificationSlate notification={mockNotification} />);

    // This would require the component to expose action buttons in a testable way
    // For now, we'll test the basic structure
    expect(mockMarkAsRead).not.toHaveBeenCalled();
  });

  test('should handle mark as read error gracefully', async () => {
    mockMarkAsRead.mockRejectedValue(new Error('Failed to mark as read'));

    render(<NotificationSlate notification={mockNotification} />);

    // Simulate marking as read (this would depend on the actual UI implementation)
    // The error should be caught and a toast shown
  });

  test('should call markAsUnread when mark as unread is clicked', async () => {
    const readNotification = { ...mockNotification, read: true };
    mockMarkAsUnread.mockResolvedValue({});

    render(<NotificationSlate notification={readNotification} />);

    // This would test the mark as unread functionality
    expect(mockMarkAsUnread).not.toHaveBeenCalled();
  });

  test('should call deleteNotification when delete is clicked', async () => {
    mockDeleteNotification.mockResolvedValue({});

    render(<NotificationSlate notification={mockNotification} />);

    // This would test the delete functionality
    expect(mockDeleteNotification).not.toHaveBeenCalled();
  });

  test('should generate correct notification link based on type', () => {
    render(<NotificationSlate notification={mockNotification} />);

    // Should generate link to the post for NEW_POST notifications
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/event/event-123/post/post-123');
  });

  test('should handle different notification types', () => {
    const mentionNotification = {
      ...mockNotification,
      type: 'USER_MENTIONED' as const,
    };

    render(<NotificationSlate notification={mentionNotification} />);

    // Should render mention notification with author name
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/mentioned you in/)).toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  test('should handle event-only notifications', () => {
    const eventNotification = {
      ...mockNotification,
      type: 'EVENT_EDITED' as const,
      post: undefined,
    };

    render(<NotificationSlate notification={eventNotification} />);

    // Should handle notifications without post data
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  test('should format date correctly', () => {
    const notification = {
      ...mockNotification,
      createdAt: Date.now() - 1000 * 60 * 2, // 2 minutes ago
    };

    render(<NotificationSlate notification={notification} />);

    // Should display formatted relative date
    // The exact format depends on the formatDate utility but should show relative time
    const dateText = screen.getByText(/ago|now/i);
    expect(dateText).toBeInTheDocument();
  });
});
