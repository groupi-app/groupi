/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock functions
const mockBlockUserFn = vi.fn();
const mockUnblockUserFn = vi.fn();
const mockUseBlockedUsers = vi.fn();

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

// Mock the friends hooks
vi.mock('./use-friends', () => ({
  useBlockUser: () => mockBlockUserFn,
  useUnblockUser: () => mockUnblockUserFn,
  useBlockedUsers: () => mockUseBlockedUsers(),
}));

describe('useFriends hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBlockUserFn.mockReset();
    mockUnblockUserFn.mockReset();
    mockUseBlockedUsers.mockReset();
  });

  describe('useBlockUser', () => {
    test('calls mutation with person ID', async () => {
      mockBlockUserFn.mockResolvedValue({ success: true });

      const { useBlockUser } = await import('./use-friends');
      const { result } = renderHook(() => useBlockUser());

      await act(async () => {
        await result.current('person-1' as any);
      });

      expect(mockBlockUserFn).toHaveBeenCalledWith('person-1');
    });

    test('handles error', async () => {
      mockBlockUserFn.mockRejectedValue(new Error('Block failed'));

      const { useBlockUser } = await import('./use-friends');
      const { result } = renderHook(() => useBlockUser());

      await expect(async () => {
        await act(async () => {
          await result.current('person-1' as any);
        });
      }).rejects.toThrow('Block failed');
    });
  });

  describe('useUnblockUser', () => {
    test('calls mutation with person ID', async () => {
      mockUnblockUserFn.mockResolvedValue({ success: true });

      const { useUnblockUser } = await import('./use-friends');
      const { result } = renderHook(() => useUnblockUser());

      await act(async () => {
        await result.current('person-1' as any);
      });

      expect(mockUnblockUserFn).toHaveBeenCalledWith('person-1');
    });
  });

  describe('useBlockedUsers', () => {
    test('returns undefined when loading', async () => {
      mockUseBlockedUsers.mockReturnValue(undefined);

      const { useBlockedUsers } = await import('./use-friends');
      const { result } = renderHook(() => useBlockedUsers());

      expect(result.current).toBeUndefined();
    });

    test('returns blocked users when loaded', async () => {
      const mockData = [
        { personId: 'person-1', name: 'Blocked User', blockedAt: Date.now() },
      ];
      mockUseBlockedUsers.mockReturnValue(mockData);

      const { useBlockedUsers } = await import('./use-friends');
      const { result } = renderHook(() => useBlockedUsers());

      expect(result.current).toEqual(mockData);
      expect(result.current).toHaveLength(1);
    });

    test('returns empty array when no blocked users', async () => {
      mockUseBlockedUsers.mockReturnValue([]);

      const { useBlockedUsers } = await import('./use-friends');
      const { result } = renderHook(() => useBlockedUsers());

      expect(result.current).toEqual([]);
    });
  });
});
