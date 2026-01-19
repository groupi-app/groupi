/**
 * Tests for use-navigation-guard hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigationGuard } from './use-navigation-guard';

// Mock next/navigation
let mockPathname = '/initial-path';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('useNavigationGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockPathname = '/initial-path';

    // Reset history state
    window.history.replaceState(null, '', window.location.href);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return shouldFlash as false initially', () => {
      const { result } = renderHook(() => useNavigationGuard(false));

      expect(result.current.shouldFlash).toBe(false);
    });

    it('should return triggerFlash function', () => {
      const { result } = renderHook(() => useNavigationGuard(false));

      expect(typeof result.current.triggerFlash).toBe('function');
    });

    it('should return shouldBlockNavigation function', () => {
      const { result } = renderHook(() => useNavigationGuard(false));

      expect(typeof result.current.shouldBlockNavigation).toBe('function');
    });
  });

  describe('triggerFlash', () => {
    it('should set shouldFlash to true when isDirty is true', () => {
      const { result } = renderHook(() => useNavigationGuard(true));

      act(() => {
        result.current.triggerFlash();
      });

      expect(result.current.shouldFlash).toBe(true);
    });

    it('should not set shouldFlash when isDirty is false', () => {
      const { result } = renderHook(() => useNavigationGuard(false));

      act(() => {
        result.current.triggerFlash();
      });

      expect(result.current.shouldFlash).toBe(false);
    });

    it('should reset shouldFlash after 1 second', () => {
      const { result } = renderHook(() => useNavigationGuard(true));

      act(() => {
        result.current.triggerFlash();
      });

      expect(result.current.shouldFlash).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.shouldFlash).toBe(false);
    });

    it('should not reset before 1 second', () => {
      const { result } = renderHook(() => useNavigationGuard(true));

      act(() => {
        result.current.triggerFlash();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.shouldFlash).toBe(true);
    });
  });

  describe('shouldBlockNavigation', () => {
    it('should return true and trigger flash when isDirty is true', () => {
      const { result } = renderHook(() => useNavigationGuard(true));

      let blocked: boolean = false;
      act(() => {
        blocked = result.current.shouldBlockNavigation();
      });

      expect(blocked).toBe(true);
      expect(result.current.shouldFlash).toBe(true);
    });

    it('should return false when isDirty is false', () => {
      const { result } = renderHook(() => useNavigationGuard(false));

      let blocked: boolean = true;
      act(() => {
        blocked = result.current.shouldBlockNavigation();
      });

      expect(blocked).toBe(false);
      expect(result.current.shouldFlash).toBe(false);
    });
  });

  describe('beforeunload handler', () => {
    it('should add beforeunload listener when isDirty is true', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNavigationGuard(true));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should not add beforeunload listener when isDirty is false', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNavigationGuard(false));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should remove beforeunload listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNavigationGuard(true));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should prevent default and set returnValue on beforeunload', () => {
      renderHook(() => useNavigationGuard(true));

      const event = new Event('beforeunload') as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      // Add returnValue property
      Object.defineProperty(event, 'returnValue', {
        writable: true,
        value: undefined,
      });

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(event.returnValue).toBe('');
    });
  });

  describe('popstate handler', () => {
    it('should add popstate listener when isDirty is true', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNavigationGuard(true));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should not add popstate listener when isDirty is false', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNavigationGuard(false));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should remove popstate listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNavigationGuard(true));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should push history state to prevent navigation on popstate', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      renderHook(() => useNavigationGuard(true));

      // Clear initial pushState call
      pushStateSpy.mockClear();

      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(pushStateSpy).toHaveBeenCalledWith(null, '', window.location.href);
    });
  });

  describe('isDirty state changes', () => {
    it('should add listeners when isDirty changes to true', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const { rerender } = renderHook(
        ({ isDirty }) => useNavigationGuard(isDirty),
        { initialProps: { isDirty: false } }
      );

      addEventListenerSpy.mockClear();

      rerender({ isDirty: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should remove listeners when isDirty changes to false', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { rerender } = renderHook(
        ({ isDirty }) => useNavigationGuard(isDirty),
        { initialProps: { isDirty: true } }
      );

      rerender({ isDirty: false });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });
  });

  describe('function memoization', () => {
    it('should maintain stable triggerFlash reference when isDirty unchanged', () => {
      const { result, rerender } = renderHook(() => useNavigationGuard(true));

      const firstRef = result.current.triggerFlash;
      rerender();

      expect(result.current.triggerFlash).toBe(firstRef);
    });

    it('should update triggerFlash reference when isDirty changes', () => {
      const { result, rerender } = renderHook(
        ({ isDirty }) => useNavigationGuard(isDirty),
        { initialProps: { isDirty: false } }
      );

      const firstRef = result.current.triggerFlash;
      rerender({ isDirty: true });

      expect(result.current.triggerFlash).not.toBe(firstRef);
    });

    it('should maintain stable shouldBlockNavigation reference when isDirty unchanged', () => {
      const { result, rerender } = renderHook(() => useNavigationGuard(true));

      const firstRef = result.current.shouldBlockNavigation;
      rerender();

      expect(result.current.shouldBlockNavigation).toBe(firstRef);
    });
  });
});
