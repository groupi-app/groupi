'use client';

import { EventSettingsAddons } from './event-settings-addons';

/** Compatibility entry point; management is owned by Event Settings. */
export function ManageAddonsContent({ eventId }: { eventId: string }) {
  return <EventSettingsAddons eventId={eventId} />;
}
