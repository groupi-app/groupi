/**
 * Tests for notification-close-store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNotificationCloseStore } from './notification-close-store';

describe('useNotificationCloseStore', () => {
  // Reset the store between tests
  beforeEach(() => {
    const { result } = renderHook(() => useNotificationCloseStore());
    act(() => {
      result.current.setPopoverOpen(false);
      result.current.setSheetOpen(false);
    });
  });

  describe('initial state', () => {
    it('should have popoverOpen as false initially', () => {
      const { result } = renderHook(() => useNotificationCloseStore());
      expect(result.current.popoverOpen).toBe(false);
    });

    it('should have sheetOpen as false initially', () => {
      const { result } = renderHook(() => useNotificationCloseStore());
      expect(result.current.sheetOpen).toBe(false);
    });
  });

  describe('setPopoverOpen', () => {
    it('should set popoverOpen to true', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setPopoverOpen(true);
      });

      expect(result.current.popoverOpen).toBe(true);
    });

    it('should set popoverOpen to false', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setPopoverOpen(true);
      });
      expect(result.current.popoverOpen).toBe(true);

      act(() => {
        result.current.setPopoverOpen(false);
      });
      expect(result.current.popoverOpen).toBe(false);
    });

    it('should not affect sheetOpen state', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setPopoverOpen(true);
      });

      expect(result.current.sheetOpen).toBe(false);
    });
  });

  describe('setSheetOpen', () => {
    it('should set sheetOpen to true', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setSheetOpen(true);
      });

      expect(result.current.sheetOpen).toBe(true);
    });

    it('should set sheetOpen to false', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setSheetOpen(true);
      });
      expect(result.current.sheetOpen).toBe(true);

      act(() => {
        result.current.setSheetOpen(false);
      });
      expect(result.current.sheetOpen).toBe(false);
    });

    it('should not affect popoverOpen state', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setSheetOpen(true);
      });

      expect(result.current.popoverOpen).toBe(false);
    });
  });

  describe('state persistence across hooks', () => {
    it('should share popoverOpen state across instances', () => {
      const { result: result1 } = renderHook(() => useNotificationCloseStore());
      const { result: result2 } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result1.current.setPopoverOpen(true);
      });

      expect(result2.current.popoverOpen).toBe(true);
    });

    it('should share sheetOpen state across instances', () => {
      const { result: result1 } = renderHook(() => useNotificationCloseStore());
      const { result: result2 } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result1.current.setSheetOpen(true);
      });

      expect(result2.current.sheetOpen).toBe(true);
    });
  });

  describe('independent state management', () => {
    it('should manage both states independently', () => {
      const { result } = renderHook(() => useNotificationCloseStore());

      act(() => {
        result.current.setPopoverOpen(true);
        result.current.setSheetOpen(true);
      });

      expect(result.current.popoverOpen).toBe(true);
      expect(result.current.sheetOpen).toBe(true);

      act(() => {
        result.current.setPopoverOpen(false);
      });

      expect(result.current.popoverOpen).toBe(false);
      expect(result.current.sheetOpen).toBe(true);
    });
  });
});
