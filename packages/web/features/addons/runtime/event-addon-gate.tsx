'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useAddonGating } from './use-addon-gating';

/** Match route segments relative to this event, never substrings in a post ID. */
function isExemptRoute(pathname: string, eventId: string) {
  const prefix = `/event/${eventId}`;
  if (!pathname.startsWith(`${prefix}/`)) return false;
  const route = pathname.slice(prefix.length).replace(/\/$/, '');
  return (
    /^\/(availability|manage-addons|settings)(\/|$)/.test(route) ||
    /^\/addon\/[^/]+$/.test(route)
  );
}

/** Keep event content hidden until its completion workflow has been resolved. */
export function EventAddonGate({
  eventId,
  children,
}: {
  eventId: Id<'events'>;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { redirectTo, isLoading } = useAddonGating(eventId);
  const isExempt = isExemptRoute(pathname, eventId);
  const shouldRedirect = !isExempt && !isLoading && redirectTo !== null;

  useEffect(() => {
    if (shouldRedirect) router.replace(redirectTo);
  }, [shouldRedirect, redirectTo, router]);

  if (!isExempt && (isLoading || shouldRedirect)) {
    return <p role='status'>Loading event…</p>;
  }
  return <>{children}</>;
}
