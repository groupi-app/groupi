'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reminderOptOutQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reminderOptOutMutations: any;

function initApi() {
  if (!reminderOptOutQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    reminderOptOutQueries = api.reminderOptOuts?.queries ?? {};
    reminderOptOutMutations = api.reminderOptOuts?.mutations ?? {};
  }
}
initApi();

/**
 * Check if the current user has opted out of reminders for an event (with optimistic updates)
 */
export function useIsReminderOptedOut(eventId: Id<'events'>) {
  const serverState = useQuery(reminderOptOutQueries.isReminderOptedOut, {
    eventId,
  });
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Reset optimistic state when server state changes
  useEffect(() => {
    if (serverState !== undefined) {
      setOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isOptedOut changes
  }, [serverState?.isOptedOut]);

  // Return optimistic state if set, otherwise server state
  const isOptedOut =
    optimisticState !== null
      ? optimisticState
      : (serverState?.isOptedOut ?? false);

  return {
    isOptedOut,
    isLoading: serverState === undefined,
    setOptimisticOptedOut: setOptimisticState,
  };
}

/**
 * Toggle reminder opt-out for an event (with optimistic updates)
 */
export function useToggleReminderOptOut() {
  const toggleOptOut = useMutation(
    reminderOptOutMutations.toggleReminderOptOut
  );
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      currentOptedOut: boolean,
      setOptimisticOptedOut?: (value: boolean | null) => void
    ) => {
      // Optimistically update the UI
      const newState = !currentOptedOut;
      setOptimisticOptedOut?.(newState);

      try {
        const result = await toggleOptOut({ eventId });

        toast({
          title: result.isOptedOut ? 'Reminder opted out' : 'Reminder opted in',
          description: result.isOptedOut
            ? "You won't receive reminders for this event"
            : "You'll now receive reminders for this event",
        });

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticOptedOut?.(null);
        toast({
          title: 'Error',
          description: 'Failed to update reminder settings. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toggleOptOut, toast]
  );
}
