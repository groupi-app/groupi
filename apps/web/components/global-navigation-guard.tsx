'use client';

import { useEffect } from 'react';
import { useNavigationGuardContext } from '@/app/(settings)/settings/components/navigation-guard-context';
import { usePathname } from 'next/navigation';

/**
 * Global navigation guard that intercepts all link clicks
 * and prevents navigation when there are unsaved changes.
 *
 * Performance optimizations:
 * - Only attaches listener when guard context exists (settings pages)
 * - Early returns for non-link clicks
 * - Uses event delegation efficiently
 */
export function GlobalNavigationGuard() {
  const guardContext = useNavigationGuardContext();
  const currentPath = usePathname();

  useEffect(() => {
    // Only attach listener when guard context exists (i.e., on settings pages)
    // This means zero overhead on all other pages
    if (!guardContext) return;

    const handleClick = (e: MouseEvent) => {
      // Early return for non-link clicks - most clicks won't be on links
      const target = e.target as HTMLElement;
      if (!target) return;

      // Fast path: check if click is directly on an anchor or inside one
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Get the href - early return if no href or hash link
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) return;

      // Skip external links and special protocols (fast string checks)
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      // Skip if clicking the same route (common case)
      if (href === currentPath) return;

      // Only now check if navigation should be blocked
      // This is the most expensive check, so we do it last
      const shouldBlock = guardContext.shouldBlockNavigation();
      if (shouldBlock) {
        e.preventDefault();
        e.stopPropagation();
        guardContext.triggerFlash();
      }
    };

    // Use capture phase to catch events early, before they bubble
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [guardContext, currentPath]);

  return null;
}
