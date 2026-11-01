import type { useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';

export function createEventSettingsHooks<
  Api extends {
    events: {
      queries: {
        getSettings: FunctionReference<'query'>;
        getSettingsAudienceOptions: FunctionReference<'query'>;
      };
      mutations: { saveSettings: FunctionReference<'mutation'> };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useEventSettings(
    args: FunctionArgs<Api['events']['queries']['getSettings']> | 'skip'
  ) {
    return hooks.useQuery<Api['events']['queries']['getSettings']>(
      api.events.queries.getSettings,
      args
    );
  }
  function useEventSettingsAudienceOptions(
    args:
      | FunctionArgs<Api['events']['queries']['getSettingsAudienceOptions']>
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['events']['queries']['getSettingsAudienceOptions']
    >(api.events.queries.getSettingsAudienceOptions, args);
  }
  function useSaveEventSettings() {
    return hooks.useMutation<Api['events']['mutations']['saveSettings']>(
      api.events.mutations.saveSettings
    );
  }
  return {
    useEventSettings,
    useSaveEventSettings,
    useEventSettingsAudienceOptions,
  };
}
