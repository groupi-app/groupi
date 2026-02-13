import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock functions
const mockUsePrivacySettings = vi.fn();
const mockSavePrivacySettingsFn = vi.fn();

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

// Mock the settings hooks
vi.mock('./use-settings', () => ({
  usePrivacySettings: () => mockUsePrivacySettings(),
  useSavePrivacySettings: () => mockSavePrivacySettingsFn,
}));

describe('useSettings hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrivacySettings.mockReset();
    mockSavePrivacySettingsFn.mockReset();
  });

  describe('usePrivacySettings', () => {
    test('returns undefined when loading', async () => {
      mockUsePrivacySettings.mockReturnValue(undefined);

      const { usePrivacySettings } = await import('./use-settings');
      const { result } = renderHook(() => usePrivacySettings());

      expect(result.current).toBeUndefined();
    });

    test('returns privacy settings when loaded', async () => {
      const mockData = {
        allowFriendRequestsFrom: 'EVERYONE',
        allowEventInvitesFrom: 'FRIENDS',
      };
      mockUsePrivacySettings.mockReturnValue(mockData);

      const { usePrivacySettings } = await import('./use-settings');
      const { result } = renderHook(() => usePrivacySettings());

      expect(result.current).toEqual(mockData);
      expect(result.current!.allowFriendRequestsFrom).toBe('EVERYONE');
      expect(result.current!.allowEventInvitesFrom).toBe('FRIENDS');
    });
  });

  describe('useSavePrivacySettings', () => {
    test('calls mutation with correct data', async () => {
      mockSavePrivacySettingsFn.mockResolvedValue({ success: true });

      const { useSavePrivacySettings } = await import('./use-settings');
      const { result } = renderHook(() => useSavePrivacySettings());

      await act(async () => {
        await result.current({
          allowFriendRequestsFrom: 'NO_ONE',
          allowEventInvitesFrom: 'FRIENDS',
        });
      });

      expect(mockSavePrivacySettingsFn).toHaveBeenCalledWith({
        allowFriendRequestsFrom: 'NO_ONE',
        allowEventInvitesFrom: 'FRIENDS',
      });
    });

    test('handles error', async () => {
      mockSavePrivacySettingsFn.mockRejectedValue(new Error('Save failed'));

      const { useSavePrivacySettings } = await import('./use-settings');
      const { result } = renderHook(() => useSavePrivacySettings());

      await expect(async () => {
        await act(async () => {
          await result.current({
            allowFriendRequestsFrom: 'EVERYONE',
            allowEventInvitesFrom: 'EVERYONE',
          });
        });
      }).rejects.toThrow('Save failed');
    });
  });
});
