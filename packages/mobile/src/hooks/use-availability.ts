import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export function useEventAvailabilityData(eventId: Id<'events'> | undefined) {
  return useQuery(
    api.availability.queries.getEventAvailabilityData,
    eventId ? { eventId } : 'skip'
  );
}

export function useSubmitAvailability() {
  const mutation = useMutation(api.availability.mutations.submitAvailability);

  return useCallback(
    async (params: {
      eventId: Id<'events'>;
      responses: Array<{
        potentialDateTimeId: Id<'potentialDateTimes'>;
        status: 'YES' | 'NO' | 'MAYBE';
        note?: string;
      }>;
    }) => {
      try {
        const result = await mutation(params);
        toast.success('Availability saved!');
        return result;
      } catch (error) {
        toast.error('Failed to save availability');
        throw error;
      }
    },
    [mutation]
  );
}
