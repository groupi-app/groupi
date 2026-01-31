'use client';

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import {
  useLocalOnlineStatus,
  computeOnlineStatus,
} from './use-local-online-status';

describe('useLocalOnlineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns empty array when presenceData is undefined', () => {
    const { result } = renderHook(() => useLocalOnlineStatus(undefined));
    expect(result.current).toEqual([]);
  });

  test('returns empty array when presenceData is empty', () => {
    const { result } = renderHook(() => useLocalOnlineStatus([]));
    expect(result.current).toEqual([]);
  });

  test('marks user as online when lastHeartbeat within threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', name: 'User One', lastHeartbeat: now - 30000 }, // 30s ago
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    // Advance time to trigger effect and setTick
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].isOnline).toBe(true);
  });

  test('marks user as offline when lastHeartbeat exceeds threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', name: 'User One', lastHeartbeat: now - 90000 }, // 90s ago (> 60s default)
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].isOnline).toBe(false);
  });

  test('marks user as offline when lastHeartbeat is undefined', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', name: 'User One', lastHeartbeat: undefined },
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].isOnline).toBe(false);
  });

  test('uses default 60s offline threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', name: 'Online', lastHeartbeat: now - 59000 }, // 59s - online
      { id: 'user-2', name: 'Offline', lastHeartbeat: now - 61000 }, // 61s - offline
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current[0].isOnline).toBe(true);
    expect(result.current[1].isOnline).toBe(false);
  });

  test('respects custom offline threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', name: 'User', lastHeartbeat: now - 25000 }, // 25s ago
    ];

    // Custom threshold of 20s (20000ms)
    const { result } = renderHook(() =>
      useLocalOnlineStatus(presenceData, 20000)
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Should be offline since 25s > 20s threshold
    expect(result.current[0].isOnline).toBe(false);
  });

  test('updates status periodically without network requests', async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    // User is online at the start (30s old heartbeat)
    const presenceData = [
      { id: 'user-1', name: 'User', lastHeartbeat: now - 30000 },
    ];

    const { result } = renderHook(
      () => useLocalOnlineStatus(presenceData, 60000, 10000) // 60s threshold, 10s refresh
    );

    // Initial tick
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current[0].isOnline).toBe(true);

    // Advance time by 35 seconds (heartbeat now 65s old, > 60s threshold)
    act(() => {
      vi.advanceTimersByTime(35000);
    });

    expect(result.current[0].isOnline).toBe(false);
  });

  test('preserves all original properties when adding isOnline', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      {
        id: 'user-1',
        name: 'User One',
        email: 'user@example.com',
        avatar: 'https://example.com/avatar.png',
        lastHeartbeat: now - 30000,
      },
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current[0]).toMatchObject({
      id: 'user-1',
      name: 'User One',
      email: 'user@example.com',
      avatar: 'https://example.com/avatar.png',
      isOnline: true,
    });
  });

  test('handles multiple users with mixed online/offline status', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [
      { id: 'user-1', lastHeartbeat: now - 10000 }, // Online (10s)
      { id: 'user-2', lastHeartbeat: now - 30000 }, // Online (30s)
      { id: 'user-3', lastHeartbeat: now - 70000 }, // Offline (70s)
      { id: 'user-4', lastHeartbeat: undefined }, // Offline (no heartbeat)
      { id: 'user-5', lastHeartbeat: now - 59999 }, // Online (just under threshold)
    ];

    const { result } = renderHook(() => useLocalOnlineStatus(presenceData));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.map(u => u.isOnline)).toEqual([
      true,
      true,
      false,
      false,
      true,
    ]);
  });

  test('uses custom refresh interval', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const presenceData = [{ id: 'user-1', lastHeartbeat: now - 30000 }];

    // Custom refresh of 5s instead of 10s default
    const { result } = renderHook(() =>
      useLocalOnlineStatus(presenceData, 60000, 5000)
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current[0].isOnline).toBe(true);

    // Advance 35s - user should now be offline (65s old heartbeat)
    act(() => {
      vi.advanceTimersByTime(35000);
    });

    expect(result.current[0].isOnline).toBe(false);
  });

  test('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useLocalOnlineStatus([]));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});

describe('computeOnlineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns true when lastHeartbeat within threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    expect(computeOnlineStatus(now - 30000)).toBe(true); // 30s ago
    expect(computeOnlineStatus(now - 59000)).toBe(true); // 59s ago
  });

  test('returns false when lastHeartbeat exceeds threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    expect(computeOnlineStatus(now - 61000)).toBe(false); // 61s ago
    expect(computeOnlineStatus(now - 120000)).toBe(false); // 2min ago
  });

  test('returns false when lastHeartbeat is undefined', () => {
    expect(computeOnlineStatus(undefined)).toBe(false);
  });

  test('respects custom offline threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    // 25s old heartbeat with 20s threshold = offline
    expect(computeOnlineStatus(now - 25000, 20000)).toBe(false);

    // 25s old heartbeat with 30s threshold = online
    expect(computeOnlineStatus(now - 25000, 30000)).toBe(true);
  });

  test('handles edge case at exactly the threshold', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    // Exactly at threshold (60s) - should be offline (>= is false)
    expect(computeOnlineStatus(now - 60000)).toBe(false);

    // Just under threshold - should be online
    expect(computeOnlineStatus(now - 59999)).toBe(true);
  });
});
