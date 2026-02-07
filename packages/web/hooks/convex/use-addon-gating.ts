'use client';

import { useQuery } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { getAddonRegistry } from '@/app/(newEvent)/create/components/addon-registry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let addonQueries: any;

function initApi() {
  if (!addonQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    addonQueries = api.addons?.queries ?? {};
  }
}
initApi();

/**
 * Hook that checks whether the current user needs to complete
 * any required addons before accessing event content.
 *
 * Returns `redirectTo` as a path relative to /event/[eventId] if the user
 * should be redirected, or null if they're clear to view the event.
 */
export function useAddonGating(eventId: Id<'events'>) {
  const status = useQuery(addonQueries.getAddonCompletionStatus, { eventId });

  if (status === undefined) {
    return { redirectTo: null, isLoading: true };
  }

  if (status === null) {
    return { redirectTo: null, isLoading: false };
  }

  // Organizers are exempt from gating
  if (status.isOrganizer) {
    return { redirectTo: null, isLoading: false };
  }

  // Check availability first
  if (status.availability.required && !status.availability.completed) {
    return {
      redirectTo: `/event/${eventId}/availability`,
      isLoading: false,
    };
  }

  // Check each addon against the registry for requiresCompletion
  const registry = getAddonRegistry();
  for (const addon of status.addons) {
    if (addon.completed) continue;

    const definition = registry.find(r => r.id === addon.addonType);
    if (!definition?.requiresCompletion || !definition.completionRoute)
      continue;

    return {
      redirectTo: `/event/${eventId}${definition.completionRoute}`,
      isLoading: false,
    };
  }

  return { redirectTo: null, isLoading: false };
}
