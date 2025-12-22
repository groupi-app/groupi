import { fetchMemberListAction } from '@/actions/query-actions';
import type { EventAttendeesPageData } from '@groupi/schema/data';

/**
 * Query adapter functions for memberships
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches member list for an event
 * Adapter: Converts result tuple to React Query format
 * @param eventId - Event ID
 * @returns EventAttendeesPageData or throws error
 */
export async function fetchMemberList(
  eventId: string
): Promise<EventAttendeesPageData> {
  const [error, data] = await fetchMemberListAction(eventId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}
