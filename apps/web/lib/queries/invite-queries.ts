import { fetchEventInvitesAction } from '@/actions/query-actions';
import type { EventInvitePageData } from '@groupi/schema/data';

/**
 * Query adapter functions for invites
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches event invite management data
 * Adapter: Converts result tuple to React Query format
 * @param eventId - Event ID
 * @returns EventInvitePageData or throws error
 */
export async function fetchEventInvites(
  eventId: string
): Promise<EventInvitePageData> {
  const [error, data] = await fetchEventInvitesAction(eventId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}

