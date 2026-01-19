'use client';

import { AttendeesContent } from './attendees-content';

/**
 * Attendees page content component - Client-only architecture
 * - Authentication handled at layout level
 * - All data fetching and business logic handled by AttendeesContent
 * - Real-time updates via Convex subscriptions
 */
export function AttendeesPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <AttendeesContent params={params} />;
}
