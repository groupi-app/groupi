'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track document visibility state
 *
 * Uses the Page Visibility API to detect when the tab is visible/hidden.
 * Useful for pausing expensive operations (like presence heartbeats)
 * when the user isn't actively viewing the page.
 *
 * @returns true if the document is visible, false if hidden
 */
export function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    // SSR safety: default to visible
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
