import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export function useEventAvailabilityData(eventId: string | undefined) {
  return useQuery(
    api.events.queries.getEventAvailabilityData,
    eventId ? { eventId } : 'skip'
  );
}

export function useSubmitAvailability() {
  const mutation = useMutation(api.availability.mutations.submitAvailability);

  return useCallback(
    async (params: {
      eventId: string;
      responses: Array<{ potentialDateTimeId: string; status: string }>;
    }) => {
      try {
        await mutation(params);
        toast.success('Availability saved!');
      } catch {
        toast.error('Failed to save availability');
      }
    },
    [mutation]
  );
}
