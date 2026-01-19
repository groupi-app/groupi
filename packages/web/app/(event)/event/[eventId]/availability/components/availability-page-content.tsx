'use client';

import { AvailabilityContent } from './availability-content';

/**
 * Availability page content component - Client-only architecture
 * - Authentication handled at layout level
 * - All data fetching and business logic handled by AvailabilityContent
 * - Real-time updates via Convex subscriptions
 */
export function AvailabilityPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <AvailabilityContent params={params} />;
}
