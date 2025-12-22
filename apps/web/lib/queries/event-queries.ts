import {
  fetchEventHeaderAction,
  fetchUserEventsAction,
} from '@/actions/query-actions';
import type { EventHeaderData, UserDashboardData } from '@groupi/schema/data';

/**
 * Query adapter functions for events
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches event header data
 * Adapter: Converts result tuple to React Query format
 * @param eventId - Event ID
 * @returns EventHeaderData or throws error
 */
export async function fetchEventHeader(
  eventId: string
): Promise<EventHeaderData> {
  const [error, data] = await fetchEventHeaderAction(eventId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}

/**
 * Fetches user's event list (dashboard data)
 * Adapter: Converts result tuple to React Query format
 * @returns UserDashboardData or throws error
 */
export async function fetchUserEvents(): Promise<UserDashboardData> {
  const [error, data] = await fetchUserEventsAction();

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}
