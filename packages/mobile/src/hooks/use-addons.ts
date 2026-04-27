import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

// --- Queries ---

export function useEventAddons(eventId: string | undefined) {
  return useQuery(
    api.addons.queries.getEventAddons,
    eventId ? { eventId } : 'skip'
  );
}

export function useAddonConfig(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonConfig,
    eventId && addonType ? { eventId, addonType } : 'skip'
  );
}

export function useAddonData(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonData,
    eventId && addonType ? { eventId, addonType } : 'skip'
  );
}

export function useAddonDataByKey(
  eventId: string | undefined,
  addonType: string | undefined,
  key: string | undefined
) {
  return useQuery(
    api.addons.queries.getAddonDataByKey,
    eventId && addonType && key ? { eventId, addonType, key } : 'skip'
  );
}

export function useMyAddonData(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.getMyAddonData,
    eventId && addonType ? { eventId, addonType } : 'skip'
  );
}

export function useAddonCompletionStatus(eventId: string | undefined) {
  return useQuery(
    api.addons.queries.getAddonCompletionStatus,
    eventId ? { eventId } : 'skip'
  );
}

export function useIsAddonOptedOut(
  eventId: string | undefined,
  addonType: string | undefined
) {
  return useQuery(
    api.addons.queries.isAddonOptedOut,
    eventId && addonType ? { eventId, addonType } : 'skip'
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
        await mutation(params);
        toast.success('Add-on enabled');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to enable add-on';
        toast.error(message);
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
        await mutation(params);
        toast.success('Add-on disabled');
      } catch {
        toast.error('Failed to disable add-on');
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
        await mutation(params);
        toast.success('Add-on config updated');
      } catch {
        toast.error('Failed to update add-on config');
      }
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
        await mutation(params);
      } catch {
        toast.error('Failed to save data');
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
        const result = await mutation(params);
        toast.success(
          result?.isOptedOut ? 'Opted out of add-on' : 'Opted back in'
        );
        return result;
      } catch {
        toast.error('Failed to update opt-out');
      }
    },
    [mutation]
  );
}
