/**
 * Tests for filter-sort-store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFilterSortStore } from './filter-sort-store';

describe('useFilterSortStore', () => {
  // Reset the store between tests
  beforeEach(() => {
    const { result } = renderHook(() => useFilterSortStore());
    act(() => {
      result.current.setSortBy('lastactivity');
      result.current.setFilter('all');
    });
  });

  describe('initial state', () => {
    it('should have default sortBy of lastactivity', () => {
      const { result } = renderHook(() => useFilterSortStore());
      expect(result.current.sortBy).toBe('lastactivity');
    });

    it('should have default filter of all', () => {
      const { result } = renderHook(() => useFilterSortStore());
      expect(result.current.filter).toBe('all');
    });
  });

  describe('setSortBy', () => {
    it('should update sortBy to title', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setSortBy('title');
      });

      expect(result.current.sortBy).toBe('title');
    });

    it('should update sortBy to createdat', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setSortBy('createdat');
      });

      expect(result.current.sortBy).toBe('createdat');
    });

    it('should update sortBy to eventdate', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setSortBy('eventdate');
      });

      expect(result.current.sortBy).toBe('eventdate');
    });

    it('should update sortBy to lastactivity', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setSortBy('title');
      });
      expect(result.current.sortBy).toBe('title');

      act(() => {
        result.current.setSortBy('lastactivity');
      });
      expect(result.current.sortBy).toBe('lastactivity');
    });
  });

  describe('setFilter', () => {
    it('should update filter to my', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setFilter('my');
      });

      expect(result.current.filter).toBe('my');
    });

    it('should update filter to all', () => {
      const { result } = renderHook(() => useFilterSortStore());

      act(() => {
        result.current.setFilter('my');
      });
      expect(result.current.filter).toBe('my');

      act(() => {
        result.current.setFilter('all');
      });
      expect(result.current.filter).toBe('all');
    });
  });

  describe('state persistence across hooks', () => {
    it('should share state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useFilterSortStore());
      const { result: result2 } = renderHook(() => useFilterSortStore());

      act(() => {
        result1.current.setSortBy('title');
      });

      expect(result2.current.sortBy).toBe('title');
    });

    it('should share filter state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useFilterSortStore());
      const { result: result2 } = renderHook(() => useFilterSortStore());

      act(() => {
        result1.current.setFilter('my');
      });

      expect(result2.current.filter).toBe('my');
    });
  });
});
