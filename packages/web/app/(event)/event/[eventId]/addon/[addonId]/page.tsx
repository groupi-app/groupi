'use client';

import { use } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { AddonPage } from '@/features/addons/page';

export default function EventAddonPage({
  params,
}: {
  params: Promise<{ eventId: string; addonId: string }>;
}) {
  const { eventId, addonId } = use(params);
  return <AddonPage eventId={eventId as Id<'events'>} addonId={addonId} />;
}
