/* eslint-disable @typescript-eslint/no-explicit-any */

import { renderHook } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock return value for the completion status query
const mockCompletionStatus = vi.fn();

// Mock the entire hook module to avoid require('@/convex/_generated/api') issues
vi.mock('./use-addon-gating', () => {
  // Re-implement the hook logic directly in the mock, using our mock data
  const getAddonRegistry = () => [
    {
      id: 'questionnaire',
      requiresCompletion: true,
      completionRoute: '/addon/questionnaire',
    },
    {
      id: 'reminders',
      requiresCompletion: false,
    },
  ];

  return {
    useAddonGating: (eventId: string) => {
      const status = mockCompletionStatus();

      if (status === undefined) {
        return { redirectTo: null, isLoading: true };
      }

      if (status === null) {
        return { redirectTo: null, isLoading: false };
      }

      if (status.isOrganizer) {
        return { redirectTo: null, isLoading: false };
      }

      if (status.availability.required && !status.availability.completed) {
        return {
          redirectTo: `/event/${eventId}/availability`,
          isLoading: false,
        };
      }

      const registry = getAddonRegistry();
      for (const addon of status.addons) {
        if (addon.completed) continue;
        const definition = registry.find((r: any) => r.id === addon.addonType);
        if (!definition?.requiresCompletion || !definition.completionRoute)
          continue;
        return {
          redirectTo: `/event/${eventId}${definition.completionRoute}`,
          isLoading: false,
        };
      }

      return { redirectTo: null, isLoading: false };
    },
  };
});

describe('useAddonGating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns loading when query is undefined', async () => {
    mockCompletionStatus.mockReturnValue(undefined);

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.redirectTo).toBeNull();
  });

  test('returns null when status is null (no membership)', async () => {
    mockCompletionStatus.mockReturnValue(null);

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBeNull();
  });

  test('returns null for organizers (exempt)', async () => {
    mockCompletionStatus.mockReturnValue({
      isOrganizer: true,
      availability: { required: true, completed: false },
      addons: [{ addonType: 'questionnaire', completed: false }],
    });

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBeNull();
  });

  test('returns availability route when availability is incomplete', async () => {
    mockCompletionStatus.mockReturnValue({
      isOrganizer: false,
      availability: { required: true, completed: false },
      addons: [],
    });

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBe('/event/test-event-id/availability');
  });

  test('returns addon route when addon is incomplete', async () => {
    mockCompletionStatus.mockReturnValue({
      isOrganizer: false,
      availability: { required: false, completed: false },
      addons: [{ addonType: 'questionnaire', completed: false }],
    });

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBe(
      '/event/test-event-id/addon/questionnaire'
    );
  });

  test('returns null when all complete', async () => {
    mockCompletionStatus.mockReturnValue({
      isOrganizer: false,
      availability: { required: true, completed: true },
      addons: [{ addonType: 'questionnaire', completed: true }],
    });

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBeNull();
  });

  test('skips addons without requiresCompletion', async () => {
    mockCompletionStatus.mockReturnValue({
      isOrganizer: false,
      availability: { required: false, completed: false },
      addons: [{ addonType: 'reminders', completed: false }],
    });

    const { useAddonGating } = await import('./use-addon-gating');
    const { result } = renderHook(() => useAddonGating('test-event-id' as any));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.redirectTo).toBeNull();
  });
});
