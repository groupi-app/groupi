'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

// ===== API REFERENCES =====
// Dynamic require to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let availabilityQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let availabilityMutations: any;

function initApi() {
  if (!availabilityQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    availabilityQueries = api.availability?.queries ?? {};
    availabilityMutations = api.availability?.mutations ?? {};
  }
}
initApi();

// ===== AVAILABILITY QUERIES =====

/**
 * Get availability data for an event
 */
export function useEventAvailabilityData(eventId: Id<'events'>) {
  return useQuery(availabilityQueries.getEventAvailabilityData, { eventId });
}

/**
 * Get availability data with skip support for conditional fetching.
 * Use this when you want to skip the query entirely (e.g., on non-availability pages).
 */
export function useEventAvailabilityDataWithSkip(eventId: Id<'events'> | null) {
  const shouldSkip = !eventId;
  return useQuery(
    availabilityQueries.getEventAvailabilityData,
    shouldSkip ? 'skip' : { eventId }
  );
}

/**
 * Get potential date times for an event (simpler version)
 */
export function useEventPotentialDates(eventId: Id<'events'>) {
  return useQuery(availabilityQueries.getEventPotentialDates, { eventId });
}

// ===== AVAILABILITY MUTATIONS =====

/**
 * Submit availability for multiple potential date times
 */
export function useSubmitAvailability() {
  const submitAvailability = useMutation(
    availabilityMutations.submitAvailability
  );
  const { toast } = useToast();

  return useCallback(
    async (data: {
      eventId: Id<'events'>;
      responses: Array<{
        potentialDateTimeId: Id<'potentialDateTimes'>;
        status: 'YES' | 'NO' | 'MAYBE';
        note?: string;
      }>;
    }) => {
      try {
        const result = await submitAvailability({
          eventId: data.eventId,
          responses: data.responses,
        });

        toast({
          title: 'Success',
          description: 'Your availability has been saved!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save availability. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [submitAvailability, toast]
  );
}

/**
 * Update availability for a single potential date time
 */
export function useUpdateSingleAvailability() {
  const updateSingleAvailability = useMutation(
    availabilityMutations.updateSingleAvailability
  );
  const { toast } = useToast();

  return useCallback(
    async (data: {
      potentialDateTimeId: Id<'potentialDateTimes'>;
      status: 'YES' | 'NO' | 'MAYBE';
      note?: string;
    }) => {
      try {
        const result = await updateSingleAvailability({
          potentialDateTimeId: data.potentialDateTimeId,
          status: data.status,
          note: data.note,
        });

        // Show success toast only for explicit user actions (not optimistic updates)
        toast({
          title: 'Updated',
          description: 'Your availability has been updated!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update availability. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateSingleAvailability, toast]
  );
}

/**
 * Clear all availability for an event
 */
export function useClearAllAvailability() {
  const clearAllAvailability = useMutation(
    availabilityMutations.clearAllAvailability
  );
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await clearAllAvailability({ eventId });

        toast({
          title: 'Cleared',
          description: 'All your availability responses have been cleared!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear availability. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [clearAllAvailability, toast]
  );
}

/**
 * Add potential date times to an event (organizer only)
 */
export function useAddPotentialDateTimes() {
  const addPotentialDateTimes = useMutation(
    availabilityMutations.addPotentialDateTimes
  );
  const { toast } = useToast();

  return useCallback(
    async (data: { eventId: Id<'events'>; dateTimes: Date[] }) => {
      try {
        const result = await addPotentialDateTimes({
          eventId: data.eventId,
          dateTimes: data.dateTimes.map(dt => dt.getTime()),
        });

        toast({
          title: 'Success',
          description: `${result.potentialDateTimes.length} date option(s) added!`,
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add date options. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [addPotentialDateTimes, toast]
  );
}

/**
 * Remove potential date times from an event (organizer only)
 */
export function useRemovePotentialDateTimes() {
  const removePotentialDateTimes = useMutation(
    availabilityMutations.removePotentialDateTimes
  );
  const { toast } = useToast();

  return useCallback(
    async (potentialDateTimeIds: Id<'potentialDateTimes'>[]) => {
      try {
        const result = await removePotentialDateTimes({ potentialDateTimeIds });

        toast({
          title: 'Success',
          description: `${result.deletedCount} date option(s) removed!`,
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove date options. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [removePotentialDateTimes, toast]
  );
}

/**
 * Update the note on a potential date time (organizer only)
 */
export function useUpdatePotentialDateTimeNote() {
  const updateNote = useMutation(
    availabilityMutations.updatePotentialDateTimeNote
  );
  const { toast } = useToast();

  return useCallback(
    async (data: {
      potentialDateTimeId: Id<'potentialDateTimes'>;
      note?: string;
    }) => {
      try {
        const result = await updateNote({
          potentialDateTimeId: data.potentialDateTimeId,
          note: data.note,
        });

        toast({
          title: 'Updated',
          description: 'Date option note has been updated!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update note. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateNote, toast]
  );
}

// ===== HOOK ALIASES FOR COMPONENT COMPATIBILITY =====

/**
 * Alias for useEventAvailabilityData - for component compatibility
 */
export const useEventAvailability = useEventAvailabilityData;
