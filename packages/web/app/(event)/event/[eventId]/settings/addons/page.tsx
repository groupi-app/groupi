'use client';

import { use } from 'react';
import { EventSettingsAddons } from '@/features/addons/runtime';

export default function EventSettingsAddonsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  return <EventSettingsAddons eventId={eventId} />;
}
