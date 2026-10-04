'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNavigationHistoryIndex,
  getBrowserHistoryIndex,
  getNavigationHistoryScope,
} from '@/lib/navigation-history';

/** Protect a draft before Next's popstate handler can unmount its page. */
export function useInviteListNavigationGuard(
  dirty: boolean,
  requestLeave: (leave: () => void) => void,
  warnBeforeUnload = dirty
) {
  const router = useRouter();
  const [untrackedHistory, setUntrackedHistory] = useState(false);
  const requestRef = useRef(requestLeave);
  const allowedLeave = useRef(false);
  useLayoutEffect(() => {
    requestRef.current = requestLeave;
  });
  useEffect(() => {
    if (!dirty) {
      allowedLeave.current = false;
      return;
    }
    const originalIndex = getNavigationHistoryIndex();
    const originalBrowserIndex = getBrowserHistoryIndex();
    const originalScope = getNavigationHistoryScope();
    let restoring = false;
    let afterRestoration: (() => void) | undefined;
    let delta: number | undefined;
    function restored() {
      restoring = false;
      afterRestoration?.();
      afterRestoration = undefined;
    }

    function click(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest('a') : null;
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (!['http:', 'https:'].includes(destination.protocol)) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.origin === window.location.origin
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      requestRef.current(() => {
        allowedLeave.current = true;
        if (destination.origin === window.location.origin)
          router.push(
            destination.pathname + destination.search + destination.hash
          );
        else window.location.assign(destination.href);
      });
    }
    function unload(event: BeforeUnloadEvent) {
      if (allowedLeave.current || !warnBeforeUnload) return;
      event.preventDefault();
      event.returnValue = '';
    }
    function pop(event: PopStateEvent) {
      if (allowedLeave.current) return;
      event.stopImmediatePropagation();
      const currentIndex =
        getNavigationHistoryScope(event.state) === originalScope
          ? getNavigationHistoryIndex(event.state)
          : undefined;
      if (restoring) {
        const currentBrowserIndex = getBrowserHistoryIndex();
        const correction =
          originalBrowserIndex !== undefined &&
          currentBrowserIndex !== undefined
            ? originalBrowserIndex - currentBrowserIndex
            : originalIndex !== undefined && currentIndex !== undefined
              ? originalIndex - currentIndex
              : 0;
        if (correction !== 0) window.history.go(correction);
        else restored();
        return;
      }
      const targetBrowserIndex = getBrowserHistoryIndex();
      delta =
        originalBrowserIndex !== undefined && targetBrowserIndex !== undefined
          ? targetBrowserIndex - originalBrowserIndex
          : originalIndex !== undefined && currentIndex !== undefined
            ? currentIndex - originalIndex
            : undefined;
      if (delta === 0) {
        setUntrackedHistory(false);
        return;
      }
      if (delta === undefined) {
        // History API cannot reveal the direction or document boundary of an
        // untracked entry. Keep the mounted draft and explain the limitation;
        // never guess, probe, overwrite entries, or silently unmount the editor.
        setUntrackedHistory(true);
        const targetState = event.state;
        requestRef.current(() => {
          allowedLeave.current = true;
          window.dispatchEvent(
            new PopStateEvent('popstate', { state: targetState })
          );
        });
        return;
      }
      setUntrackedHistory(false);
      restoring = true;
      // Show the decision only after the original entry is restored, so even an
      // immediate Discard cannot unmount the draft during restoration.
      afterRestoration = () =>
        requestRef.current(() => {
          if (delta === undefined) return;
          allowedLeave.current = true;
          window.history.go(delta);
        });
      window.history.go(-delta);
    }
    document.addEventListener('click', click, true);
    window.addEventListener('beforeunload', unload);
    window.addEventListener('popstate', pop, true);
    return () => {
      document.removeEventListener('click', click, true);
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('popstate', pop, true);
    };
  }, [dirty, warnBeforeUnload, router]);
  return dirty && untrackedHistory
    ? 'This browser cannot safely restore an untracked history entry. Your draft is preserved, but the address may show your attempted destination. Use the opposite browser history button to return before continuing.'
    : undefined;
}
