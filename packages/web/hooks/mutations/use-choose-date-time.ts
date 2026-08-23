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

type ManualDateSelection = {
  source: 'manual';
  eventId: Id<'events'>;
  dateTime: Date;
  endDateTime?: Date | null;
};

type PollDateSelection = {
  source: 'poll';
  eventId: Id<'events'>;
  dateTime: Date;
  endDateTime?: Date | null;
  potentialDateTimeId: Id<'potentialDateTimes'>;
};

export type ChooseDateTimeSelection = ManualDateSelection | PollDateSelection;

export function useChooseDateTime() {
  const chooseEventDate = useMutation(eventMutations.chooseEventDate);

  return useCallback(
    async (selection: ChooseDateTimeSelection) => {
      try {
        const result = await chooseEventDate({
          eventId: selection.eventId,
          chosenDateTime: selection.dateTime.getTime(),
          chosenEndDateTime: selection.endDateTime
            ? selection.endDateTime.getTime()
            : undefined,
          selectionSource: selection.source === 'poll' ? 'POLL' : 'MANUAL',
          potentialDateTimeId:
            selection.source === 'poll'
              ? selection.potentialDateTimeId
              : undefined,
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
