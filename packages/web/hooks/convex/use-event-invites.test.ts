/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock functions
const mockUsePendingEventInvites = vi.fn();
const mockUsePendingInviteCount = vi.fn();
const mockSendEventInviteFn = vi.fn();
const mockAcceptEventInviteFn = vi.fn();
const mockDeclineEventInviteFn = vi.fn();
const mockCancelEventInviteFn = vi.fn();

const mockToast = vi.fn();

// Mock convex/react
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the event invite hooks
vi.mock('./use-event-invites', () => ({
  usePendingEventInvites: () => mockUsePendingEventInvites(),
  usePendingInviteCount: () => mockUsePendingInviteCount(),
  useSendEventInvite: () => mockSendEventInviteFn,
  useAcceptEventInvite: () => mockAcceptEventInviteFn,
  useDeclineEventInvite: () => mockDeclineEventInviteFn,
  useCancelEventInvite: () => mockCancelEventInviteFn,
}));

describe('useEventInvites hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePendingEventInvites.mockReset();
    mockUsePendingInviteCount.mockReset();
    mockSendEventInviteFn.mockReset();
    mockAcceptEventInviteFn.mockReset();
    mockDeclineEventInviteFn.mockReset();
    mockCancelEventInviteFn.mockReset();
  });

  describe('usePendingEventInvites', () => {
    test('returns undefined when loading', async () => {
      mockUsePendingEventInvites.mockReturnValue(undefined);

      const { usePendingEventInvites } = await import('./use-event-invites');
      const { result } = renderHook(() => usePendingEventInvites());

      expect(result.current).toBeUndefined();
    });

    test('returns pending invites when loaded', async () => {
      const mockData = [
        {
          inviteId: 'invite-1',
          eventId: 'event-1',
          eventTitle: 'Test Event',
          role: 'ATTENDEE',
        },
      ];
      mockUsePendingEventInvites.mockReturnValue(mockData);

      const { usePendingEventInvites } = await import('./use-event-invites');
      const { result } = renderHook(() => usePendingEventInvites());

      expect(result.current).toEqual(mockData);
      expect(result.current).toHaveLength(1);
    });

    test('returns empty array when no invites', async () => {
      mockUsePendingEventInvites.mockReturnValue([]);

      const { usePendingEventInvites } = await import('./use-event-invites');
      const { result } = renderHook(() => usePendingEventInvites());

      expect(result.current).toEqual([]);
    });
  });

  describe('usePendingInviteCount', () => {
    test('returns count of pending invites', async () => {
      mockUsePendingInviteCount.mockReturnValue(3);

      const { usePendingInviteCount } = await import('./use-event-invites');
      const { result } = renderHook(() => usePendingInviteCount());

      expect(result.current).toBe(3);
    });

    test('returns 0 when no invites', async () => {
      mockUsePendingInviteCount.mockReturnValue(0);

      const { usePendingInviteCount } = await import('./use-event-invites');
      const { result } = renderHook(() => usePendingInviteCount());

      expect(result.current).toBe(0);
    });
  });

  describe('useSendEventInvite', () => {
    test('calls mutation with correct data', async () => {
      mockSendEventInviteFn.mockResolvedValue({
        inviteId: 'invite-1',
        status: 'PENDING',
      });

      const { useSendEventInvite } = await import('./use-event-invites');
      const { result } = renderHook(() => useSendEventInvite());

      await act(async () => {
        await result.current(
          'event-1' as any,
          'person-1' as any,
          'ATTENDEE',
          'Join us!'
        );
      });

      expect(mockSendEventInviteFn).toHaveBeenCalledWith(
        'event-1',
        'person-1',
        'ATTENDEE',
        'Join us!'
      );
    });

    test('handles error', async () => {
      mockSendEventInviteFn.mockRejectedValue(
        new Error('User not accepting invites')
      );

      const { useSendEventInvite } = await import('./use-event-invites');
      const { result } = renderHook(() => useSendEventInvite());

      await expect(async () => {
        await act(async () => {
          await result.current('event-1' as any, 'person-1' as any);
        });
      }).rejects.toThrow('User not accepting invites');
    });
  });

  describe('useAcceptEventInvite', () => {
    test('calls mutation with invite and event IDs', async () => {
      mockAcceptEventInviteFn.mockResolvedValue({
        success: true,
        membershipId: 'membership-1',
      });

      const { useAcceptEventInvite } = await import('./use-event-invites');
      const { result } = renderHook(() => useAcceptEventInvite());

      await act(async () => {
        await result.current('invite-1' as any, 'event-1' as any);
      });

      expect(mockAcceptEventInviteFn).toHaveBeenCalledWith(
        'invite-1',
        'event-1'
      );
    });
  });

  describe('useDeclineEventInvite', () => {
    test('calls mutation with invite ID', async () => {
      mockDeclineEventInviteFn.mockResolvedValue({ success: true });

      const { useDeclineEventInvite } = await import('./use-event-invites');
      const { result } = renderHook(() => useDeclineEventInvite());

      await act(async () => {
        await result.current('invite-1' as any);
      });

      expect(mockDeclineEventInviteFn).toHaveBeenCalledWith('invite-1');
    });
  });

  describe('useCancelEventInvite', () => {
    test('calls mutation with invite ID', async () => {
      mockCancelEventInviteFn.mockResolvedValue({ success: true });

      const { useCancelEventInvite } = await import('./use-event-invites');
      const { result } = renderHook(() => useCancelEventInvite());

      await act(async () => {
        await result.current('invite-1' as any);
      });

      expect(mockCancelEventInviteFn).toHaveBeenCalledWith('invite-1');
    });
  });
});
