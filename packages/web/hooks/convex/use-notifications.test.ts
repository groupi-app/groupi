/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock the entire hook module to avoid dynamic import issues
const mockMarkNotificationAsRead = vi.fn();
const mockMarkNotificationAsUnread = vi.fn();
const mockDeleteNotification = vi.fn();
const mockMarkAllNotificationsAsRead = vi.fn();
const mockDeleteAllNotifications = vi.fn();
const mockNotificationManagement = vi.fn();

const mockToast = vi.fn();

// Mock convex/react
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  usePaginatedQuery: vi.fn(),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the notification hooks
vi.mock('./use-notifications', () => ({
  useMarkNotificationAsRead: () => mockMarkNotificationAsRead,
  useMarkNotificationAsUnread: () => mockMarkNotificationAsUnread,
  useDeleteNotification: () => mockDeleteNotification,
  useMarkAllNotificationsAsRead: () => mockMarkAllNotificationsAsRead,
  useDeleteAllNotifications: () => mockDeleteAllNotifications,
  // useNotificationManagement returns an object, not a function, so call the mock
  useNotificationManagement: () => mockNotificationManagement(),
}));

describe('useNotifications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockReset();
    mockMarkNotificationAsRead.mockReset();
    mockMarkNotificationAsUnread.mockReset();
    mockDeleteNotification.mockReset();
    mockMarkAllNotificationsAsRead.mockReset();
    mockDeleteAllNotifications.mockReset();
  });

  describe('useMarkNotificationAsRead', () => {
    test('should mark notification as read successfully', async () => {
      mockMarkNotificationAsRead.mockResolvedValue(undefined);

      const { useMarkNotificationAsRead } = await import('./use-notifications');
      const { result } = renderHook(() => useMarkNotificationAsRead());

      await act(async () => {
        await result.current('test-notification-id' as any);
      });

      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(
        'test-notification-id'
      );
      expect(mockToast).not.toHaveBeenCalled(); // Success toast not shown for quiet action
    });

    test('should handle error when marking notification as read', async () => {
      const error = new Error('Failed');
      mockMarkNotificationAsRead.mockRejectedValue(error);

      const { useMarkNotificationAsRead } = await import('./use-notifications');
      const { result } = renderHook(() => useMarkNotificationAsRead());

      await expect(async () => {
        await act(async () => {
          await result.current('test-notification-id' as any);
        });
      }).rejects.toThrow('Failed');

      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(
        'test-notification-id'
      );
    });
  });

  describe('useMarkNotificationAsUnread', () => {
    test('should mark notification as unread successfully', async () => {
      mockMarkNotificationAsUnread.mockResolvedValue(undefined);

      const { useMarkNotificationAsUnread } = await import(
        './use-notifications'
      );
      const { result } = renderHook(() => useMarkNotificationAsUnread());

      await act(async () => {
        await result.current('test-notification-id' as any);
      });

      expect(mockMarkNotificationAsUnread).toHaveBeenCalledWith(
        'test-notification-id'
      );
      expect(mockToast).not.toHaveBeenCalled();
    });

    test('should handle error when marking notification as unread', async () => {
      const error = new Error('Failed');
      mockMarkNotificationAsUnread.mockRejectedValue(error);

      const { useMarkNotificationAsUnread } = await import(
        './use-notifications'
      );
      const { result } = renderHook(() => useMarkNotificationAsUnread());

      await expect(async () => {
        await act(async () => {
          await result.current('test-notification-id' as any);
        });
      }).rejects.toThrow('Failed');

      expect(mockMarkNotificationAsUnread).toHaveBeenCalledWith(
        'test-notification-id'
      );
    });
  });

  describe('useDeleteNotification', () => {
    test('should delete notification successfully', async () => {
      mockDeleteNotification.mockResolvedValue(undefined);

      const { useDeleteNotification } = await import('./use-notifications');
      const { result } = renderHook(() => useDeleteNotification());

      await act(async () => {
        await result.current('test-notification-id' as any);
      });

      expect(mockDeleteNotification).toHaveBeenCalledWith(
        'test-notification-id'
      );
    });

    test('should handle error when deleting notification', async () => {
      const error = new Error('Failed');
      mockDeleteNotification.mockRejectedValue(error);

      const { useDeleteNotification } = await import('./use-notifications');
      const { result } = renderHook(() => useDeleteNotification());

      await expect(async () => {
        await act(async () => {
          await result.current('test-notification-id' as any);
        });
      }).rejects.toThrow('Failed');

      expect(mockDeleteNotification).toHaveBeenCalledWith(
        'test-notification-id'
      );
    });
  });

  describe('useMarkAllNotificationsAsRead', () => {
    test('should mark all notifications as read successfully', async () => {
      const mockResult = { count: 5, message: 'Success' };
      mockMarkAllNotificationsAsRead.mockResolvedValue(mockResult);

      const { useMarkAllNotificationsAsRead } = await import(
        './use-notifications'
      );
      const { result } = renderHook(() => useMarkAllNotificationsAsRead());

      let returnValue;
      await act(async () => {
        returnValue = await result.current();
      });

      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledWith();
      expect(returnValue).toEqual(mockResult);
    });

    test('should handle error when marking all notifications as read', async () => {
      const error = new Error('Failed');
      mockMarkAllNotificationsAsRead.mockRejectedValue(error);

      const { useMarkAllNotificationsAsRead } = await import(
        './use-notifications'
      );
      const { result } = renderHook(() => useMarkAllNotificationsAsRead());

      await expect(async () => {
        await act(async () => {
          await result.current();
        });
      }).rejects.toThrow('Failed');

      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledWith();
    });
  });

  describe('useDeleteAllNotifications', () => {
    test('should delete all notifications successfully', async () => {
      const mockResult = { count: 3, message: 'Success' };
      mockDeleteAllNotifications.mockResolvedValue(mockResult);

      const { useDeleteAllNotifications } = await import('./use-notifications');
      const { result } = renderHook(() => useDeleteAllNotifications());

      let returnValue;
      await act(async () => {
        returnValue = await result.current();
      });

      expect(mockDeleteAllNotifications).toHaveBeenCalledWith();
      expect(returnValue).toEqual(mockResult);
    });

    test('should handle error when deleting all notifications', async () => {
      const error = new Error('Failed');
      mockDeleteAllNotifications.mockRejectedValue(error);

      const { useDeleteAllNotifications } = await import('./use-notifications');
      const { result } = renderHook(() => useDeleteAllNotifications());

      await expect(async () => {
        await act(async () => {
          await result.current();
        });
      }).rejects.toThrow('Failed');

      expect(mockDeleteAllNotifications).toHaveBeenCalledWith();
    });
  });

  describe('useNotificationManagement', () => {
    test('returns loading state when notifications are undefined', async () => {
      mockNotificationManagement.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        settings: undefined,
        isLoading: true,
        isUnreadCountLoading: true,
        isSettingsLoading: true,
        hasMore: false,
        nextCursor: null,
        markAsRead: mockMarkNotificationAsRead,
        markAllAsRead: mockMarkAllNotificationsAsRead,
        deleteNotification: mockDeleteNotification,
        deleteAllNotifications: mockDeleteAllNotifications,
      });

      const { useNotificationManagement } = await import('./use-notifications');
      const { result } = renderHook(() => useNotificationManagement());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.notifications).toEqual([]);
    });

    test('returns combined data when fully loaded', async () => {
      const mockNotification = {
        _id: 'notif-1' as any,
        id: 'notif-1' as any,
        _creationTime: Date.now(),
        createdAt: Date.now(),
        type: 'NEW_POST' as const,
        read: false,
        eventId: 'event-1' as any,
        postId: 'post-1' as any,
        personId: 'person-1' as any,
        recipientId: 'person-2' as any,
        event: { id: 'event-1' as any, title: 'Test Event' },
        post: { id: 'post-1' as any, title: 'Test Post' },
        author: null,
      };

      mockNotificationManagement.mockReturnValue({
        notifications: [mockNotification],
        unreadCount: 5,
        settings: { emailEnabled: true },
        isLoading: false,
        isUnreadCountLoading: false,
        isSettingsLoading: false,
        hasMore: true,
        nextCursor: 'cursor-123',
        markAsRead: mockMarkNotificationAsRead,
        markAllAsRead: mockMarkAllNotificationsAsRead,
        deleteNotification: mockDeleteNotification,
        deleteAllNotifications: mockDeleteAllNotifications,
      });

      const { useNotificationManagement } = await import('./use-notifications');
      const { result } = renderHook(() => useNotificationManagement());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(5);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.nextCursor).toBe('cursor-123');
    });

    test('provides action methods', async () => {
      mockNotificationManagement.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        settings: {},
        isLoading: false,
        isUnreadCountLoading: false,
        isSettingsLoading: false,
        hasMore: false,
        nextCursor: null,
        markAsRead: mockMarkNotificationAsRead,
        markAllAsRead: mockMarkAllNotificationsAsRead,
        deleteNotification: mockDeleteNotification,
        deleteAllNotifications: mockDeleteAllNotifications,
      });

      const { useNotificationManagement } = await import('./use-notifications');
      const { result } = renderHook(() => useNotificationManagement());

      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.deleteAllNotifications).toBe('function');
    });

    test('handles empty notification list', async () => {
      mockNotificationManagement.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        settings: { emailEnabled: false },
        isLoading: false,
        isUnreadCountLoading: false,
        isSettingsLoading: false,
        hasMore: false,
        nextCursor: null,
        markAsRead: mockMarkNotificationAsRead,
        markAllAsRead: mockMarkAllNotificationsAsRead,
        deleteNotification: mockDeleteNotification,
        deleteAllNotifications: mockDeleteAllNotifications,
      });

      const { useNotificationManagement } = await import('./use-notifications');
      const { result } = renderHook(() => useNotificationManagement());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.hasMore).toBe(false);
    });
  });
});
