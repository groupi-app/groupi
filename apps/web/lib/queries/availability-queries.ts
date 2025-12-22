import { fetchEventAvailabilityAction } from '@/actions/query-actions';
import type { AvailabilityPageData } from '@groupi/schema/data';

/**
 * Query adapter functions for availability
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches availability data for an event
 * Adapter: Converts result tuple to React Query format
 * @param eventId - Event ID
 * @returns AvailabilityPageData or throws error
 */
export async function fetchEventAvailability(
  eventId: string
): Promise<AvailabilityPageData> {
  const [error, data] = await fetchEventAvailabilityAction(eventId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}
