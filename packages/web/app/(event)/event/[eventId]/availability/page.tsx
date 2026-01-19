import { AvailabilityPageContent } from './components/availability-page-content';
import React, { Suspense } from 'react';
import { AvailabilityFormSkeleton } from '@/components/skeletons/availability-form-skeleton';

/**
 * Availability Page - Static root for instant skeleton rendering
 * - Page root is static (no async operations) for optimal PPR
 * - All checks and redirects happen inside Suspense boundary
 * - Skeletons show immediately while checks complete
 * - Dynamic content: Auth + cached data + realtime sync wrapped in Suspense
 */
export default function EventAvailabilityPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense fallback={<AvailabilityFormSkeleton />}>
      <AvailabilityPageContent params={props.params} />
    </Suspense>
  );
}
