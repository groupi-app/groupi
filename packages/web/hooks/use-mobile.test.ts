/**
 * Tests for use-mobile hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobile } from './use-mobile';

describe('useMobile', () => {
  let originalInnerWidth: number;
  let originalOntouchstart: unknown;
  let originalMaxTouchPoints: number;

  beforeEach(() => {
    // Store originals
    originalInnerWidth = window.innerWidth;
    originalOntouchstart = (window as unknown as { ontouchstart?: unknown }).ontouchstart;
    originalMaxTouchPoints = navigator.maxTouchPoints;

    // Clear touch detection
    delete (window as unknown as { ontouchstart?: unknown }).ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
      writable: true,
    });
    if (originalOntouchstart !== undefined) {
      (window as unknown as { ontouchstart?: unknown }).ontouchstart = originalOntouchstart;
    }
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('should return false for desktop screen width', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(false);
  });

  it('should return true for mobile screen width', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(true);
  });

  it('should return true for touch devices', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024, // Large screen
      configurable: true,
      writable: true,
    });
    (window as unknown as { ontouchstart: boolean }).ontouchstart = true;

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(true);
  });

  it('should update on window resize', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useMobile());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should detect maxTouchPoints for touch devices', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(true);
  });
});
