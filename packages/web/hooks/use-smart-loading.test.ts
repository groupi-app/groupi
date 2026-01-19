/**
 * Tests for use-smart-loading hook (useConvexQuery)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConvexQuery } from './use-smart-loading';

// Mock Convex
const mockUseQuery = vi.fn();

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe('useConvexQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should return isLoading true when result is undefined', () => {
      mockUseQuery.mockReturnValue(undefined);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return isLoading false when data is loaded', () => {
      const mockData = { id: '1', name: 'Test' };
      mockUseQuery.mockReturnValue(mockData);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error state', () => {
    it('should return isError true when result is null', () => {
      mockUseQuery.mockReturnValue(null);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Query failed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });

  describe('data state', () => {
    it('should return array data correctly', () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      mockUseQuery.mockReturnValue(mockData);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should return empty array correctly', () => {
      mockUseQuery.mockReturnValue([]);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should return object data correctly', () => {
      const mockData = { name: 'Test Event', date: '2025-01-17' };
      mockUseQuery.mockReturnValue(mockData);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toEqual(mockData);
    });

    it('should return primitive data correctly', () => {
      mockUseQuery.mockReturnValue(42);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toBe(42);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return string data correctly', () => {
      mockUseQuery.mockReturnValue('test string');

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toBe('test string');
    });

    it('should return boolean false correctly (not as error)', () => {
      mockUseQuery.mockReturnValue(false);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should return boolean true correctly', () => {
      mockUseQuery.mockReturnValue(true);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.data).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('query arguments', () => {
    it('should pass query and args to useQuery', () => {
      mockUseQuery.mockReturnValue({ id: '1' });

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const mockArgs = { eventId: 'event123' };

      renderHook(() => useConvexQuery(mockQuery, mockArgs));

      expect(mockUseQuery).toHaveBeenCalledWith(mockQuery, mockArgs);
    });

    it('should handle undefined args', () => {
      mockUseQuery.mockReturnValue({ id: '1' });

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];

      renderHook(() => useConvexQuery(mockQuery));

      expect(mockUseQuery).toHaveBeenCalledWith(mockQuery, undefined);
    });

    it('should handle empty args object', () => {
      mockUseQuery.mockReturnValue({ id: '1' });

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];

      renderHook(() => useConvexQuery(mockQuery, {}));

      expect(mockUseQuery).toHaveBeenCalledWith(mockQuery, {});
    });

    it('should handle complex args', () => {
      mockUseQuery.mockReturnValue([]);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const complexArgs = {
        filters: { status: 'active', type: 'event' },
        pagination: { limit: 10, cursor: 'abc123' },
      };

      renderHook(() => useConvexQuery(mockQuery, complexArgs));

      expect(mockUseQuery).toHaveBeenCalledWith(mockQuery, complexArgs);
    });
  });

  describe('reactivity', () => {
    it('should update when query result changes', () => {
      mockUseQuery.mockReturnValue(undefined);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result, rerender } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isLoading).toBe(true);

      // Simulate data loading
      mockUseQuery.mockReturnValue({ id: '1', name: 'Loaded' });
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ id: '1', name: 'Loaded' });
    });

    it('should transition from loading to error', () => {
      mockUseQuery.mockReturnValue(undefined);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result, rerender } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      // Simulate error
      mockUseQuery.mockReturnValue(null);
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);
    });

    it('should transition from error back to data', () => {
      mockUseQuery.mockReturnValue(null);

      const mockQuery = 'test.query' as unknown as Parameters<typeof useConvexQuery>[0];
      const { result, rerender } = renderHook(() => useConvexQuery(mockQuery));

      expect(result.current.isError).toBe(true);

      // Recovery
      mockUseQuery.mockReturnValue({ recovered: true });
      rerender();

      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual({ recovered: true });
    });
  });
});
