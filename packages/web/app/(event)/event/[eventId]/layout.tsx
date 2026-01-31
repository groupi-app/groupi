'use client';

import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react';
import { EventDataProvider, useEventData } from './context';

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
      <EventLayoutContent>{children}</EventLayoutContent>
    </EventDataProvider>
  );
}

/**
 * Inner component that can access the EventDataProvider context.
 * Handles membership checking and redirects.
 */
function EventLayoutContent({ children }: { children: React.ReactNode }) {
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

  // Render children immediately - data is available via context
  return <>{children}</>;
}
