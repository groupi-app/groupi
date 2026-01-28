'use client';

import { useEventHeaderData } from '@/hooks/convex';
import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react';
import { Id } from '@/convex/_generated/dataModel';

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

/**
 * Layout for individual event pages.
 * Checks event membership and redirects to /events if not a member.
 * Authentication is already handled by the parent (event) layout.
 *
 * Note: This layout does NOT show a skeleton - each child page handles
 * its own loading state via loading.tsx or Suspense boundaries.
 * This allows new-post and edit pages to show appropriate editor skeletons
 * instead of the event header skeleton.
 */
export default function EventIdLayout({ children, params }: EventLayoutProps) {
  const { eventId } = use(params);
  const router = useRouter();

  // Fetch event data to check membership
  const eventData = useEventHeaderData(eventId as Id<'events'>);
  const isLoading = eventData === undefined;
  const isMember = eventData?.userMembership != null;
  const eventNotFound = eventData === null;

  useEffect(() => {
    // If event doesn't exist or user is not a member, redirect to events
    if (!isLoading && (eventNotFound || !isMember)) {
      router.push('/events');
    }
  }, [isLoading, isMember, eventNotFound, router]);

  // Render children immediately - each page handles its own loading state
  // This allows routes like new-post to show their editor skeleton via loading.tsx
  return <>{children}</>;
}
