'use client';

import { useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventMutations: any;
function initApi() {
  if (!eventMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    eventMutations = api.events?.mutations ?? {};
  }
}
initApi();

export function useChooseDateTime() {
  const chooseEventDate = useMutation(eventMutations.chooseEventDate);

  return useCallback(
    async (
      eventId: Id<'events'>,
      dateTime: Date,
      endDateTime?: Date | null
    ) => {
      try {
        const result = await chooseEventDate({
          eventId,
          chosenDateTime: dateTime.getTime(), // Convert to Unix timestamp
          chosenEndDateTime: endDateTime ? endDateTime.getTime() : undefined,
        });

        toast.success('Event date has been chosen!');
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to choose event date';
        toast.error(message);
        throw error;
      }
    },
    [chooseEventDate]
  );
}
