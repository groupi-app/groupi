'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let addonQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let addonMutations: any;

function initApi() {
  if (!addonQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    addonQueries = api.addons?.queries ?? {};
    addonMutations = api.addons?.mutations ?? {};
  }
}
initApi();

// ===== QUERIES =====

/**
 * Get all add-on configs for an event
 */
export function useEventAddons(eventId: Id<'events'>) {
  return useQuery(addonQueries.getEventAddons, { eventId });
}

/**
 * Get a specific add-on config for an event
 */
export function useAddonConfig(eventId: Id<'events'>, addonType: string) {
  return useQuery(addonQueries.getAddonConfig, { eventId, addonType });
}

/**
 * Check if the current user has opted out of a specific add-on (with optimistic updates)
 */
export function useIsAddonOptedOut(eventId: Id<'events'>, addonType: string) {
  const serverState = useQuery(addonQueries.isAddonOptedOut, {
    eventId,
    addonType,
  });
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Reset optimistic state when server state changes
  useEffect(() => {
    if (serverState !== undefined) {
      setOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isOptedOut changes
  }, [serverState?.isOptedOut]);

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

// ===== MUTATIONS =====

/**
 * Enable an add-on for an event
 */
export function useEnableAddon() {
  const enableAddon = useMutation(addonMutations.enableAddon);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      addonType: string,
      config: Record<string, unknown>
    ) => {
      try {
        await enableAddon({ eventId, addonType, config });
        return { success: true };
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to enable add-on. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [enableAddon, toast]
  );
}

/**
 * Disable an add-on for an event
 */
export function useDisableAddon() {
  const disableAddon = useMutation(addonMutations.disableAddon);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>, addonType: string) => {
      try {
        await disableAddon({ eventId, addonType });
        return { success: true };
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to disable add-on. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [disableAddon, toast]
  );
}

/**
 * Update the config for an already-enabled add-on
 */
export function useUpdateAddonConfig() {
  const updateConfig = useMutation(addonMutations.updateAddonConfig);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      addonType: string,
      config: Record<string, unknown>
    ) => {
      try {
        await updateConfig({ eventId, addonType, config });
        return { success: true };
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update add-on. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateConfig, toast]
  );
}

/**
 * Toggle add-on opt-out (with optimistic updates)
 */
export function useToggleAddonOptOut() {
  const toggleOptOut = useMutation(addonMutations.toggleAddonOptOut);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      addonType: string,
      currentOptedOut: boolean,
      setOptimisticOptedOut?: (value: boolean | null) => void
    ) => {
      // Optimistic update
      const newState = !currentOptedOut;
      setOptimisticOptedOut?.(newState);

      try {
        const result = await toggleOptOut({ eventId, addonType });

        toast({
          title: result.isOptedOut ? 'Opted out' : 'Opted in',
          description: result.isOptedOut
            ? "You won't receive this add-on's notifications for this event"
            : "You'll now receive this add-on's notifications for this event",
        });

        return result;
      } catch (error) {
        // Revert optimistic update
        setOptimisticOptedOut?.(null);
        toast({
          title: 'Error',
          description: 'Failed to update opt-out settings. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toggleOptOut, toast]
  );
}

// ===== ADD-ON DATA HOOKS =====

/**
 * Get all data entries for an add-on on a specific event
 */
export function useAddonData(eventId: Id<'events'>, addonType: string) {
  return useQuery(addonQueries.getAddonData, { eventId, addonType });
}

/**
 * Get a specific data entry by key
 */
export function useAddonDataByKey(
  eventId: Id<'events'>,
  addonType: string,
  key: string
) {
  return useQuery(addonQueries.getAddonDataByKey, {
    eventId,
    addonType,
    key,
  });
}

/**
 * Get all data entries created by the current user
 */
export function useMyAddonData(eventId: Id<'events'>, addonType: string) {
  return useQuery(addonQueries.getMyAddonData, { eventId, addonType });
}

/**
 * Set a data entry for an add-on (upsert by key)
 */
export function useSetAddonData() {
  const setData = useMutation(addonMutations.setAddonData);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      addonType: string,
      key: string,
      data: unknown
    ) => {
      try {
        return await setData({ eventId, addonType, key, data });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save data. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [setData, toast]
  );
}

/**
 * Delete a data entry for an add-on
 */
export function useDeleteAddonData() {
  const deleteData = useMutation(addonMutations.deleteAddonData);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>, addonType: string, key: string) => {
      try {
        return await deleteData({ eventId, addonType, key });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete data. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deleteData, toast]
  );
}
