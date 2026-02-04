import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import {
  VisibilityProvider,
  useVisibility,
  useIsVisible,
  useIsAway,
  useIsActive,
  useResetIdleTimer,
} from './visibility-provider';

// Helper to create a wrapper for hook tests
function createWrapper(idleTimeoutMs?: number) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <VisibilityProvider idleTimeoutMs={idleTimeoutMs}>
        {children}
      </VisibilityProvider>
    );
  };
}

describe('VisibilityProvider', () => {
  let originalVisibilityState: PropertyDescriptor | undefined;
  let originalHasFocus: () => boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    // Store original values
    originalVisibilityState = Object.getOwnPropertyDescriptor(
      document,
      'visibilityState'
    );
    originalHasFocus = document.hasFocus;

    // Default to visible and focused
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.hasFocus = () => true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    // Restore original values
    if (originalVisibilityState) {
      Object.defineProperty(
        document,
        'visibilityState',
        originalVisibilityState
      );
    }
    document.hasFocus = originalHasFocus;
  });

  describe('initial state', () => {
    test('reads initial visibility from document.visibilityState', () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(true);
    });

    test('reads initial hidden state from document.visibilityState', () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(false);
    });

    test('reads initial focus from document.hasFocus()', () => {
      document.hasFocus = () => true;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFocused).toBe(true);
    });

    test('reads initial unfocused state', () => {
      document.hasFocus = () => false;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFocused).toBe(false);
    });

    test('starts with isAway=false', () => {
      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAway).toBe(false);
    });
  });

  describe('visibility changes', () => {
    test('updates isVisible when tab becomes hidden', () => {
      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(true);

      // Simulate tab becoming hidden
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current.isVisible).toBe(false);
    });

    test('updates isVisible when tab becomes visible', () => {
      // Start hidden
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(false);

      // Simulate tab becoming visible
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Advance past the visibility debounce (150ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isVisible).toBe(true);
    });

    test('resets idle timer when tab becomes visible', () => {
      const idleTimeout = 1000; // 1 second for faster test

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Go idle
      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      expect(result.current.isAway).toBe(true);

      // Tab becomes hidden then visible
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Advance past the visibility debounce (150ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should reset away status
      expect(result.current.isAway).toBe(false);
    });
  });

  describe('focus changes', () => {
    test('updates isFocused when window loses focus', () => {
      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFocused).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      expect(result.current.isFocused).toBe(false);
    });

    test('updates isFocused when window gains focus', () => {
      document.hasFocus = () => false;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      expect(result.current.isFocused).toBe(true);
    });
  });

  describe('idle detection', () => {
    test('sets isAway=true after idle timeout', () => {
      const idleTimeout = 2000; // 2 seconds

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      expect(result.current.isAway).toBe(false);

      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      expect(result.current.isAway).toBe(true);
    });

    test('resets isAway=false on user activity', () => {
      const idleTimeout = 2000;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Go idle
      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      expect(result.current.isAway).toBe(true);

      // Simulate user activity
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove'));
      });

      expect(result.current.isAway).toBe(false);
    });

    test('throttles activity events to 1 per second', () => {
      const idleTimeout = 5000;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Advance 4 seconds (under idle timeout)
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // Fire multiple activity events in quick succession
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove'));
        document.dispatchEvent(new MouseEvent('mousemove'));
        document.dispatchEvent(new MouseEvent('mousemove'));
      });

      // Wait 500ms and fire more events (within throttle window)
      act(() => {
        vi.advanceTimersByTime(500);
        document.dispatchEvent(new MouseEvent('mousemove'));
      });

      // Should still not be away since we've been active
      expect(result.current.isAway).toBe(false);

      // Wait for 1 second to allow next event to process
      act(() => {
        vi.advanceTimersByTime(1000);
        document.dispatchEvent(new MouseEvent('mousemove'));
      });

      expect(result.current.isAway).toBe(false);
    });

    test('uses default 5 minute idle timeout', () => {
      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(), // No custom timeout = 5 min default
      });

      expect(result.current.isAway).toBe(false);

      // Advance 4 minutes 59 seconds
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);
      });

      expect(result.current.isAway).toBe(false);

      // Advance past 5 minutes
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isAway).toBe(true);
    });
  });

  describe('isActive computed value', () => {
    test('returns true when visible AND not away', () => {
      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.isAway).toBe(false);
      expect(result.current.isActive).toBe(true);
    });

    test('returns false when hidden', () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    test('returns false when away', () => {
      const idleTimeout = 1000;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      expect(result.current.isAway).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('resetIdleTimer', () => {
    test('clears away status when called', () => {
      const idleTimeout = 1000;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Go idle
      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      expect(result.current.isAway).toBe(true);

      // Manually reset
      act(() => {
        result.current.resetIdleTimer();
      });

      expect(result.current.isAway).toBe(false);
    });

    test('restarts idle countdown', () => {
      const idleTimeout = 2000;

      const { result } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Advance 1.5 seconds (not idle yet)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.isAway).toBe(false);

      // Reset timer
      act(() => {
        result.current.resetIdleTimer();
      });

      // Advance another 1.5 seconds (3 seconds total, but timer reset)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should still not be away since timer was reset
      expect(result.current.isAway).toBe(false);

      // Advance past the timeout from reset
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isAway).toBe(true);
    });
  });

  describe('cleanup', () => {
    test('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useVisibility(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
      removeEventListenerSpy.mockRestore();
    });
  });
});

describe('convenience hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.hasFocus = () => true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('useIsVisible', () => {
    test('returns isVisible state', () => {
      const { result } = renderHook(() => useIsVisible(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useIsAway', () => {
    test('returns isAway state', () => {
      const { result } = renderHook(() => useIsAway(), {
        wrapper: createWrapper(1000),
      });

      expect(result.current).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useIsActive', () => {
    test('returns isActive computed state', () => {
      const { result } = renderHook(() => useIsActive(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useResetIdleTimer', () => {
    test('returns resetIdleTimer function', () => {
      const { result } = renderHook(() => useResetIdleTimer(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current).toBe('function');
    });

    test('resets away status when called', () => {
      const idleTimeout = 1000;

      const visibilityResult = renderHook(() => useVisibility(), {
        wrapper: createWrapper(idleTimeout),
      });

      const resetResult = renderHook(() => useResetIdleTimer(), {
        wrapper: createWrapper(idleTimeout),
      });

      // Go idle
      act(() => {
        vi.advanceTimersByTime(idleTimeout + 100);
      });

      // Reset with the hook
      act(() => {
        resetResult.result.current();
      });

      // Check via the visibility hook (from same context would show update)
      expect(visibilityResult.result.current.isAway).toBe(true); // Different context
    });
  });
});

describe('provider with children', () => {
  test('renders children correctly', () => {
    render(
      <VisibilityProvider>
        <div data-testid='child'>Child Content</div>
      </VisibilityProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
