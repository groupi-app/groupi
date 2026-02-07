'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, use } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { EventDataProvider, useEventData } from './context';
import { useAddonGating } from '@/hooks/convex/use-addon-gating';

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

/**
 * Layout for individual event pages.
 * - Provides all event data via EventDataProvider context
 * - Data is fetched once and shared across all child pages
 * - No more skeleton flashes when navigating between event pages
 * - Authentication is handled by the parent (event) layout
 */
export default function EventIdLayout({ children, params }: EventLayoutProps) {
  const { eventId } = use(params);

  return (
    <EventDataProvider eventId={eventId}>
      <EventLayoutContent eventId={eventId}>{children}</EventLayoutContent>
    </EventDataProvider>
  );
}

/** Routes exempt from addon gating to avoid redirect loops */
const GATING_EXEMPT_PATTERNS = ['/availability', '/addon/', '/manage-addons'];

/**
 * Inner component that can access the EventDataProvider context.
 * Handles membership checking, addon gating, and redirects.
 */
function EventLayoutContent({
  children,
  eventId,
}: {
  children: React.ReactNode;
  eventId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { headerData, isLoading } = useEventData();
  const { redirectTo, isLoading: gatingLoading } = useAddonGating(
    eventId as Id<'events'>
  );

  const isMember = headerData?.userMembership != null;
  const eventNotFound = headerData === null;

  useEffect(() => {
    // If event doesn't exist or user is not a member, redirect to events
    if (!isLoading && (eventNotFound || !isMember)) {
      router.push('/events');
    }
  }, [isLoading, isMember, eventNotFound, router]);

  // Addon gating redirect
  useEffect(() => {
    if (gatingLoading || !redirectTo || !isMember) return;

    // Don't redirect if already on an exempt route
    const isExempt = GATING_EXEMPT_PATTERNS.some(pattern =>
      pathname.includes(pattern)
    );
    if (isExempt) return;

    router.push(redirectTo);
  }, [gatingLoading, redirectTo, isMember, pathname, router]);

  // Render children immediately - data is available via context
  return <>{children}</>;
}
