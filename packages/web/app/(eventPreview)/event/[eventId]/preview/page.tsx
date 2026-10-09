'use client';

import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { EventLogisticsPreview } from '@/components/organisms/event-logistics-preview';

// This viewer route does not mount the member-only EventDataProvider/layout.
export default function EventPreviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  return <EventLogisticsPreview eventId={eventId as Id<'events'>} />;
}
