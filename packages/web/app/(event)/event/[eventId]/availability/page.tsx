'use client';

import { AvailabilityContent } from './components/availability-content';

/**
 * Availability Page - Client-only architecture
 * - Authentication handled at layout level
 * - Content component handles loading state via Convex hooks
 * - Real-time updates via Convex subscriptions
 */
export default function EventAvailabilityPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  return <AvailabilityContent params={props.params} />;
}
