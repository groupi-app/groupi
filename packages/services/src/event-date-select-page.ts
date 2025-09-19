import {
  EventDateSelectPageResult,
  EventDateSelectPageError,
  EventDateSelectPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';
import { getEventPotentialDateTimes } from './availability';

// ============================================================================
// EVENT DATE SELECT PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Date Select page (organizer-only)
 * Returns potential date/time options with availability votes
 * This is a wrapper around the existing availability service with organizer validation
 */
export const getEventDateSelectPageData = async (
  eventId: string,
  userId: string
): Promise<EventDateSelectPageResult> => {
  try {
    // Reuse existing availability service
    const [serviceError, data] = await getEventPotentialDateTimes(
      eventId,
      userId
    );

    if (serviceError) {
      // Map service errors to page errors
      return error<EventDateSelectPageError>({
        _tag: serviceError._tag as any, // The error types align
        message: serviceError.message || 'An error occurred',
      });
    }

    if (!data) {
      return error<EventDateSelectPageError>({
        _tag: 'AvailabilityNotFoundError',
        message: 'No availability data found',
      });
    }

    // Check if user is an organizer
    if (data.userRole !== 'ORGANIZER') {
      return error<EventDateSelectPageError>({
        _tag: 'UnauthorizedError',
        message: 'Only organizers can select event dates',
      });
    }

    // Validate result against schema
    const validatedResult = EventDateSelectPageDataSchema.parse(data);
    return success(validatedResult);
  } catch (err) {
    console.error('Error in getEventDateSelectPageData:', err);
    return error<EventDateSelectPageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Failed to fetch date selection data',
    });
  }
};
