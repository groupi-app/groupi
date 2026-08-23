import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export type BuiltInAddonType =
  | 'reminders'
  | 'questionnaire'
  | 'bring-list'
  | 'discord';

// --- Queries ---

export function useEventAddons(eventId: string | undefined) {
  return useQuery(
    api.addons.queries.getEventAddons,
    eventId ? { eventId: eventId as Id<'events'> } : 'skip'
  );
}

export function useAddonConfig(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonConfig,
    eventId && addonType
      ? { eventId: eventId as Id<'events'>, addonType }
      : 'skip'
  );
}

export function useAddonData(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonData,
    eventId && addonType
      ? { eventId: eventId as Id<'events'>, addonType }
      : 'skip'
  );
}

export function useAddonDataByKey(
  eventId: string | undefined,
  addonType: string | undefined,
  key: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonDataByKey,
    eventId && addonType && key
      ? { eventId: eventId as Id<'events'>, addonType, key }
      : 'skip'
  );
}

export function useMyAddonData(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getMyAddonData,
    eventId && addonType
      ? { eventId: eventId as Id<'events'>, addonType }
      : 'skip'
  );
}

export function useAddonCompletionStatus(eventId: string | undefined) {
  return useQuery(
    api.addons.queries.getAddonCompletionStatus,
    eventId ? { eventId: eventId as Id<'events'> } : 'skip'
  );
}

export function useIsAddonOptedOut(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.isAddonOptedOut,
    eventId && addonType
      ? { eventId: eventId as Id<'events'>, addonType }
      : 'skip'
  );
}

// --- Mutations ---

export function useEnableAddon() {
  const mutation = useMutation(api.addons.mutations.enableAddon);

  return useCallback(
    async (params: {
      eventId: string;
      addonType: string;
      config: Record<string, unknown>;
    }) => {
      try {
        const result = await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
        toast.success('Add-on enabled');
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to enable add-on';
        toast.error(message);
        throw error;
      }
    },
    [mutation]
  );
}

export function useDisableAddon() {
  const mutation = useMutation(api.addons.mutations.disableAddon);

  return useCallback(
    async (params: { eventId: string; addonType: string }) => {
      try {
        const result = await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
        toast.success('Add-on disabled');
        return result;
      } catch (error) {
        toast.error('Failed to disable add-on');
        throw error;
      }
    },
    [mutation]
  );
}

export function useUpdateAddonConfig() {
  const mutation = useMutation(api.addons.mutations.updateAddonConfig);

  return useCallback(
    async (params: {
      eventId: string;
      addonType: string;
      config: Record<string, unknown>;
    }) => {
      try {
        const result = await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
        toast.success('Add-on config updated');
        return result;
      } catch (error) {
        toast.error('Failed to update add-on config');
        throw error;
      }
    },
    [mutation]
  );
}

export function useReplaceBuiltInAddonConfigs() {
  const mutation = useMutation(api.addons.mutations.replaceBuiltInAddonConfigs);

  return useCallback(
    async (params: {
      eventId: string;
      addons: Array<{
        addonType: BuiltInAddonType;
        config: Record<string, unknown>;
      }>;
    }) => {
      return await mutation({
        ...params,
        eventId: params.eventId as Id<'events'>,
      });
    },
    [mutation]
  );
}

export function useSetAddonData() {
  const mutation = useMutation(api.addons.mutations.setAddonData);

  return useCallback(
    async (params: {
      eventId: string;
      addonType: string;
      key: string;
      data: unknown;
    }) => {
      try {
        return await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
      } catch (error) {
        toast.error('Failed to save data');
        throw error;
      }
    },
    [mutation]
  );
}

export function useDeleteAddonData() {
  const mutation = useMutation(api.addons.mutations.deleteAddonData);

  return useCallback(
    async (params: { eventId: string; addonType: string; key: string }) => {
      try {
        return await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
      } catch (error) {
        toast.error('Failed to remove data');
        throw error;
      }
    },
    [mutation]
  );
}

export function useToggleAddonOptOut() {
  const mutation = useMutation(api.addons.mutations.toggleAddonOptOut);

  return useCallback(
    async (params: { eventId: string; addonType: string }) => {
      try {
        const result = await mutation({
          ...params,
          eventId: params.eventId as Id<'events'>,
        });
        toast.success(
          result?.isOptedOut ? 'Opted out of add-on' : 'Opted back in'
        );
        return result;
      } catch (error) {
        toast.error('Failed to update opt-out');
        throw error;
      }
    },
    [mutation]
  );
}
