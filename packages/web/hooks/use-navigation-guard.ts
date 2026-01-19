'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationGuard(isDirty: boolean) {
  const [shouldFlash, setShouldFlash] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);

  // Flash animation handler
  const triggerFlash = useCallback(() => {
    if (!isDirty) return;
    setShouldFlash(true);
    // Reset flash after animation completes
    setTimeout(() => {
      setShouldFlash(false);
    }, 1000);
  }, [isDirty]);

  // Handle browser navigation (refresh, close tab, etc.)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      triggerFlash();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, triggerFlash]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      // Push the current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
      triggerFlash();
    };

    // Push a state to enable popstate detection (only once)
    const hasPushedState = window.history.state !== null;
    if (!hasPushedState) {
      window.history.pushState(null, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, triggerFlash]);

  // Handle route changes via pathname monitoring (useLayoutEffect for synchronous flash)
  useLayoutEffect(() => {
    // Skip on initial mount
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // If pathname changed and we have unsaved changes
    if (
      prevPathnameRef.current !== pathname &&
      isDirty &&
      !isNavigatingRef.current
    ) {
      // This shouldn't happen if we're blocking navigation properly,
      // but if it does, trigger flash synchronously
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronous flash needed for navigation guard
      triggerFlash();
    }

    prevPathnameRef.current = pathname;
  }, [pathname, isDirty, triggerFlash]);

  // Function to check if navigation should be blocked
  const shouldBlockNavigation = useCallback(() => {
    if (!isDirty) return false;
    triggerFlash();
    return true;
  }, [isDirty, triggerFlash]);

  // Reset navigation flag when form becomes clean
  useEffect(() => {
    if (!isDirty) {
      isNavigatingRef.current = false;
    }
  }, [isDirty]);

  return {
    shouldFlash,
    triggerFlash,
    shouldBlockNavigation,
  };
}
