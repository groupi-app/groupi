import {
  EventAvailabilityPageResult,
  EventAvailabilityPageError,
  EventAvailabilityPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';
import { getEventPotentialDateTimes } from './availability';

// ============================================================================
// EVENT AVAILABILITY PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Availability page
 * Returns potential date/time options with availability votes
 * This is a wrapper around the existing availability service
 */
export const getEventAvailabilityPageData = async (
  eventId: string,
  userId: string
): Promise<EventAvailabilityPageResult> => {
  try {
    // Reuse existing availability service
    const [serviceError, data] = await getEventPotentialDateTimes(
      eventId,
      userId
    );

    if (serviceError) {
      // Map service errors to page errors
      return error<EventAvailabilityPageError>({
        _tag: serviceError._tag as any, // The error types align
        message: serviceError.message || 'An error occurred',
      });
    }

    if (!data) {
      return error<EventAvailabilityPageError>({
        _tag: 'AvailabilityNotFoundError',
        message: 'No availability data found',
      });
    }

    // Validate result against schema
    const validatedResult = EventAvailabilityPageDataSchema.parse(data);
    return success(validatedResult);
  } catch (err) {
    console.error('Error in getEventAvailabilityPageData:', err);
    return error<EventAvailabilityPageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Failed to fetch availability data',
    });
  }
};
