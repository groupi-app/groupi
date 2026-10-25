'use client';

import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { EventDataProvider, useEventData } from './context';
import { EventAddonGate } from '@/features/addons/gating';
import { EventPageSkeleton } from '@/components/skeletons/event-page-skeleton';

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
  const { headerData, isLoading } = useEventData();
  const isMember = headerData?.userMembership != null;
  const eventNotFound = headerData === null;

  useEffect(() => {
    // If event doesn't exist or user is not a member, redirect to events
    if (!isLoading && (eventNotFound || !isMember)) {
      router.push('/events');
    }
  }, [isLoading, isMember, eventNotFound, router]);

  if (eventNotFound || (headerData !== undefined && !isMember)) {
    return <p role='status'>Redirecting to events…</p>;
  }
  if (isLoading) return <EventPageSkeleton />;

  return (
    <EventAddonGate eventId={eventId as Id<'events'>}>
      {children}
    </EventAddonGate>
  );
}
