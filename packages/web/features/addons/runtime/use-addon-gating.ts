'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getAddonCompletion } from '../completion';

/** Resolve completion requirements from this event's saved configuration. */
export function useAddonGating(eventId: Id<'events'>) {
  const status = useQuery(api.addons.queries.getAddonCompletionStatus, {
    eventId,
  });
  // This query requires membership. A null completion status must not cause an
  // unauthorized config request while the event layout redirects non-members.
  const configs = useQuery(
    api.addons.queries.getEventAddons,
    status && !status.isOrganizer ? { eventId } : 'skip'
  );

  if (status === undefined) {
    return { redirectTo: null, isLoading: true };
  }
  if (status === null || status.isOrganizer) {
    return { redirectTo: null, isLoading: false };
  }
  if (status.availability.required && !status.availability.completed) {
    return {
      redirectTo: `/event/${eventId}/availability`,
      isLoading: false,
    };
  }
  if (configs === undefined) {
    return { redirectTo: null, isLoading: true };
  }

  for (const addon of status.addons) {
    if (addon.completed) continue;
    const config = configs.find(item => item.addonType === addon.addonType);
    if (!config?.enabled) continue;
    const definition = getAddonCompletion(addon.addonType, config.config);
    if (!definition?.requiresCompletion || !definition.completionRoute)
      continue;
    return {
      redirectTo: `/event/${eventId}${definition.completionRoute}`,
      isLoading: false,
    };
  }
  return { redirectTo: null, isLoading: false };
}
