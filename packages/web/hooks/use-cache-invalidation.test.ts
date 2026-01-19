/**
 * Tests for use-cache-invalidation hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCacheInvalidation } from './use-cache-invalidation';

// Get the mock router
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe('useCacheInvalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('should return an invalidation function', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    expect(typeof result.current).toBe('function');
  });

  it('should call API with tags and refresh router', async () => {
    const { result } = renderHook(() => useCacheInvalidation());

    await result.current(['events', 'posts']);

    expect(global.fetch).toHaveBeenCalledWith('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['events', 'posts'] }),
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle single tag', async () => {
    const { result } = renderHook(() => useCacheInvalidation());

    await result.current(['notifications']);

    expect(global.fetch).toHaveBeenCalledWith('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['notifications'] }),
    });
  });

  it('should handle empty tags array', async () => {
    const { result } = renderHook(() => useCacheInvalidation());

    await result.current([]);

    expect(global.fetch).toHaveBeenCalledWith('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: [] }),
    });
  });
});
