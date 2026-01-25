/**
 * Tests for use-action-menu hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActionMenu } from './use-action-menu';

// Mock the useMobile hook
vi.mock('./use-mobile', () => ({
  useMobile: vi.fn(),
}));

import { useMobile } from './use-mobile';

describe('useActionMenu', () => {
  beforeEach(() => {
    vi.mocked(useMobile).mockReturnValue(false); // Default to desktop
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with sheetOpen as false', () => {
      const { result } = renderHook(() => useActionMenu());

      expect(result.current.sheetOpen).toBe(false);
    });

    it('should expose isMobile from useMobile hook', () => {
      vi.mocked(useMobile).mockReturnValue(true);

      const { result } = renderHook(() => useActionMenu());

      expect(result.current.isMobile).toBe(true);
    });
  });

  describe('setSheetOpen', () => {
    it('should update sheetOpen state', () => {
      const { result } = renderHook(() => useActionMenu());

      act(() => {
        result.current.setSheetOpen(true);
      });

      expect(result.current.sheetOpen).toBe(true);

      act(() => {
        result.current.setSheetOpen(false);
      });

      expect(result.current.sheetOpen).toBe(false);
    });
  });

  describe('handleContextMenu', () => {
    it('should open sheet on mobile', () => {
      vi.mocked(useMobile).mockReturnValue(true);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleContextMenu(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.sheetOpen).toBe(true);
    });

    it('should not open sheet on desktop', () => {
      vi.mocked(useMobile).mockReturnValue(false);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleContextMenu(mockEvent);
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(result.current.sheetOpen).toBe(false);
    });
  });

  describe('handleClick', () => {
    it('should prevent default on mobile', () => {
      vi.mocked(useMobile).mockReturnValue(true);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleClick(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not prevent default on desktop', () => {
      vi.mocked(useMobile).mockReturnValue(false);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleClick(mockEvent);
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handleMoreClick', () => {
    it('should open sheet on mobile', () => {
      vi.mocked(useMobile).mockReturnValue(true);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleMoreClick(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.sheetOpen).toBe(true);
    });

    it('should not open sheet on desktop', () => {
      vi.mocked(useMobile).mockReturnValue(false);

      const { result } = renderHook(() => useActionMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleMoreClick(mockEvent);
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(result.current.sheetOpen).toBe(false);
    });
  });

  describe('memoization', () => {
    it('should maintain stable function references', () => {
      vi.mocked(useMobile).mockReturnValue(true);

      const { result, rerender } = renderHook(() => useActionMenu());

      const firstRender = {
        handleContextMenu: result.current.handleContextMenu,
        handleClick: result.current.handleClick,
        handleMoreClick: result.current.handleMoreClick,
      };

      rerender();

      // Functions should be memoized and maintain same reference
      expect(result.current.handleContextMenu).toBe(
        firstRender.handleContextMenu
      );
      expect(result.current.handleClick).toBe(firstRender.handleClick);
      expect(result.current.handleMoreClick).toBe(firstRender.handleMoreClick);
    });

    it('should update function references when isMobile changes', () => {
      vi.mocked(useMobile).mockReturnValue(false);

      const { result, rerender } = renderHook(() => useActionMenu());

      const desktopHandlers = {
        handleContextMenu: result.current.handleContextMenu,
        handleClick: result.current.handleClick,
        handleMoreClick: result.current.handleMoreClick,
      };

      // Change to mobile
      vi.mocked(useMobile).mockReturnValue(true);
      rerender();

      // Functions should have new references due to dependency change
      expect(result.current.handleContextMenu).not.toBe(
        desktopHandlers.handleContextMenu
      );
      expect(result.current.handleClick).not.toBe(desktopHandlers.handleClick);
      expect(result.current.handleMoreClick).not.toBe(
        desktopHandlers.handleMoreClick
      );
    });
  });
});
