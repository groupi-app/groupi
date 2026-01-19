/**
 * Tests for use-is-overflow hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsOverflowing } from './use-is-overflow';

describe('useIsOverflowing', () => {
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;

  beforeEach(() => {
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    vi.restoreAllMocks();
  });

  it('should return a ref and isOverflowing state', () => {
    const { result } = renderHook(() => useIsOverflowing());

    expect(result.current[0]).toBeDefined();
    expect(typeof result.current[1]).toBe('boolean');
  });

  it('should initially return false for isOverflowing', () => {
    const { result } = renderHook(() => useIsOverflowing());

    expect(result.current[1]).toBe(false);
  });

  it('should detect overflow when scrollHeight > clientHeight', () => {
    const { result } = renderHook(() => useIsOverflowing());

    // Manually set ref.current with mock element
    const mockElement = {
      scrollHeight: 200,
      clientHeight: 100,
    };

    // Update the ref
    Object.defineProperty(result.current[0], 'current', {
      value: mockElement,
      writable: true,
    });

    // Trigger resize to re-check overflow
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current[1]).toBe(true);
  });

  it('should not detect overflow when scrollHeight <= clientHeight', () => {
    const { result } = renderHook(() => useIsOverflowing());

    const mockElement = {
      scrollHeight: 100,
      clientHeight: 100,
    };

    Object.defineProperty(result.current[0], 'current', {
      value: mockElement,
      writable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current[1]).toBe(false);
  });

  it('should add resize event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useIsOverflowing());

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should remove resize event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useIsOverflowing());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle null ref gracefully', () => {
    const { result } = renderHook(() => useIsOverflowing());

    // ref.current is null by default
    expect(result.current[0].current).toBe(null);

    // Triggering resize should not throw
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current[1]).toBe(false);
  });

  it('should update overflow state on window resize', () => {
    const { result } = renderHook(() => useIsOverflowing());

    // Start with no overflow
    const mockElement = {
      scrollHeight: 100,
      clientHeight: 100,
    };

    Object.defineProperty(result.current[0], 'current', {
      value: mockElement,
      writable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current[1]).toBe(false);

    // Simulate content change causing overflow
    mockElement.scrollHeight = 300;

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current[1]).toBe(true);
  });
});
