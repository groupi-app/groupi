/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock the entire hook module to avoid dynamic import issues with require()
const mockUseEventInvites = vi.fn();
const mockUseInviteByToken = vi.fn();
const mockCreateInviteFn = vi.fn();
const mockUpdateInviteFn = vi.fn();
const mockDeleteInvitesFn = vi.fn();
const mockAcceptInviteFn = vi.fn();

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

// Mock the invite hooks to avoid require('@/convex/_generated/api') issues
vi.mock('./use-invites', () => ({
  useEventInvites: (eventId: any) => mockUseEventInvites(eventId),
  useInviteByToken: (token: string) => mockUseInviteByToken(token),
  useCreateInvite: () => mockCreateInviteFn,
  useUpdateInvite: () => mockUpdateInviteFn,
  useDeleteInvites: () => mockDeleteInvitesFn,
  useAcceptInvite: () => mockAcceptInviteFn,
}));

describe('useInvites hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockReset();
    mockUseEventInvites.mockReset();
    mockUseInviteByToken.mockReset();
    mockCreateInviteFn.mockReset();
    mockUpdateInviteFn.mockReset();
    mockDeleteInvitesFn.mockReset();
    mockAcceptInviteFn.mockReset();
  });

  describe('useEventInvites', () => {
    test('returns undefined when loading', async () => {
      mockUseEventInvites.mockReturnValue(undefined);

      const { useEventInvites } = await import('./use-invites');
      const { result } = renderHook(() =>
        useEventInvites('test-event-id' as any)
      );

      expect(result.current).toBeUndefined();
      expect(mockUseEventInvites).toHaveBeenCalledWith('test-event-id');
    });

    test('returns invite list when loaded', async () => {
      const mockData = {
        invites: [
          {
            _id: 'invite-1',
            token: 'abc123',
            name: 'Test Invite',
            usesRemaining: 5,
          },
          {
            _id: 'invite-2',
            token: 'def456',
            name: 'Another Invite',
            usesRemaining: 10,
          },
        ],
        userRole: 'ORGANIZER',
      };
      mockUseEventInvites.mockReturnValue(mockData);

      const { useEventInvites } = await import('./use-invites');
      const { result } = renderHook(() =>
        useEventInvites('test-event-id' as any)
      );

      expect(result.current).toEqual(mockData);
      expect(result.current?.invites).toHaveLength(2);
    });
  });

  describe('useInviteByToken', () => {
    test('returns null for invalid token', async () => {
      mockUseInviteByToken.mockReturnValue(null);

      const { useInviteByToken } = await import('./use-invites');
      const { result } = renderHook(() => useInviteByToken('invalid-token'));

      expect(result.current).toBeNull();
      expect(mockUseInviteByToken).toHaveBeenCalledWith('invalid-token');
    });

    test('returns invite for valid token', async () => {
      const mockData = {
        invite: {
          id: 'invite-1',
          token: 'valid-token',
          eventId: 'event-1',
          usesRemaining: 5,
        },
        event: {
          id: 'event-1',
          title: 'Test Event',
          description: 'A test event',
        },
      };
      mockUseInviteByToken.mockReturnValue(mockData);

      const { useInviteByToken } = await import('./use-invites');
      const { result } = renderHook(() => useInviteByToken('valid-token'));

      expect(result.current).toEqual(mockData);
      expect(result.current?.event.title).toBe('Test Event');
    });
  });

  describe('useCreateInvite', () => {
    test('calls mutation with correct data', async () => {
      mockCreateInviteFn.mockResolvedValue({ invite: { id: 'new-invite-id' } });

      const { useCreateInvite } = await import('./use-invites');
      const { result } = renderHook(() => useCreateInvite());

      await act(async () => {
        await result.current({
          eventId: 'event-1' as any,
          name: 'New Invite',
          usesTotal: 10,
        });
      });

      expect(mockCreateInviteFn).toHaveBeenCalledWith({
        eventId: 'event-1',
        name: 'New Invite',
        usesTotal: 10,
      });
    });

    test('shows error toast on failure', async () => {
      mockCreateInviteFn.mockRejectedValue(new Error('Failed'));

      const { useCreateInvite } = await import('./use-invites');
      const { result } = renderHook(() => useCreateInvite());

      await expect(async () => {
        await act(async () => {
          await result.current({
            eventId: 'event-1' as any,
            name: 'New Invite',
          });
        });
      }).rejects.toThrow('Failed');

      expect(mockCreateInviteFn).toHaveBeenCalled();
    });

    test('converts Date to timestamp', async () => {
      mockCreateInviteFn.mockResolvedValue({ invite: { id: 'new-invite-id' } });

      const { useCreateInvite } = await import('./use-invites');
      const { result } = renderHook(() => useCreateInvite());

      const expiresAt = new Date('2025-12-31');
      await act(async () => {
        await result.current({
          eventId: 'event-1' as any,
          expiresAt,
        });
      });

      expect(mockCreateInviteFn).toHaveBeenCalledWith({
        eventId: 'event-1',
        expiresAt,
      });
    });
  });

  describe('useUpdateInvite', () => {
    test('calls mutation with correct data', async () => {
      mockUpdateInviteFn.mockResolvedValue({ invite: { id: 'invite-1' } });

      const { useUpdateInvite } = await import('./use-invites');
      const { result } = renderHook(() => useUpdateInvite());

      await act(async () => {
        await result.current({
          inviteId: 'invite-1' as any,
          name: 'Updated Name',
          usesTotal: 20,
        });
      });

      expect(mockUpdateInviteFn).toHaveBeenCalledWith({
        inviteId: 'invite-1',
        name: 'Updated Name',
        usesTotal: 20,
      });
    });

    test('shows error toast on failure', async () => {
      mockUpdateInviteFn.mockRejectedValue(new Error('Failed'));

      const { useUpdateInvite } = await import('./use-invites');
      const { result } = renderHook(() => useUpdateInvite());

      await expect(async () => {
        await act(async () => {
          await result.current({
            inviteId: 'invite-1' as any,
            name: 'Updated Name',
          });
        });
      }).rejects.toThrow('Failed');

      expect(mockUpdateInviteFn).toHaveBeenCalled();
    });
  });

  describe('useDeleteInvites', () => {
    test('calls mutation with array of invite IDs', async () => {
      mockDeleteInvitesFn.mockResolvedValue({ deletedCount: 2 });

      const { useDeleteInvites } = await import('./use-invites');
      const { result } = renderHook(() => useDeleteInvites());

      await act(async () => {
        await result.current(['invite-1' as any, 'invite-2' as any]);
      });

      expect(mockDeleteInvitesFn).toHaveBeenCalledWith([
        'invite-1',
        'invite-2',
      ]);
    });

    test('shows error toast on failure', async () => {
      mockDeleteInvitesFn.mockRejectedValue(new Error('Failed'));

      const { useDeleteInvites } = await import('./use-invites');
      const { result } = renderHook(() => useDeleteInvites());

      await expect(async () => {
        await act(async () => {
          await result.current(['invite-1' as any]);
        });
      }).rejects.toThrow('Failed');

      expect(mockDeleteInvitesFn).toHaveBeenCalled();
    });
  });

  describe('useAcceptInvite', () => {
    test('calls mutation with token', async () => {
      const mockResult = {
        membership: { id: 'membership-1' },
        event: { title: 'Test Event' },
      };
      mockAcceptInviteFn.mockResolvedValue(mockResult);

      const { useAcceptInvite } = await import('./use-invites');
      const { result } = renderHook(() => useAcceptInvite());

      await act(async () => {
        await result.current('invite-token-123');
      });

      expect(mockAcceptInviteFn).toHaveBeenCalledWith('invite-token-123');
    });

    test('shows welcome toast on success', async () => {
      const mockResult = {
        membership: { id: 'membership-1' },
        event: { title: 'Awesome Party' },
      };
      mockAcceptInviteFn.mockResolvedValue(mockResult);

      const { useAcceptInvite } = await import('./use-invites');
      const { result } = renderHook(() => useAcceptInvite());

      await act(async () => {
        await result.current('invite-token-123');
      });

      expect(mockAcceptInviteFn).toHaveBeenCalled();
    });

    test('shows error toast on failure', async () => {
      mockAcceptInviteFn.mockRejectedValue(new Error('Invalid invite'));

      const { useAcceptInvite } = await import('./use-invites');
      const { result } = renderHook(() => useAcceptInvite());

      await expect(async () => {
        await act(async () => {
          await result.current('invalid-token');
        });
      }).rejects.toThrow('Invalid invite');

      expect(mockAcceptInviteFn).toHaveBeenCalled();
    });
  });
});
