import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference, FunctionArgs } from 'convex/server';
interface LifecycleApi {
  events: {
    lifecycleOperations: {
      getLifecycle: FunctionReference<'query'>;
      setLifecycle: FunctionReference<'mutation'>;
    };
  };
}
export function createEventLifecycleHooks<Api extends LifecycleApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useEventLifecycle(
    args:
      | FunctionArgs<Api['events']['lifecycleOperations']['getLifecycle']>
      | 'skip'
  ) {
    return hooks.useQuery<Api['events']['lifecycleOperations']['getLifecycle']>(
      api.events.lifecycleOperations.getLifecycle,
      args
    );
  }
  function useSetEventLifecycle() {
    return hooks.useMutation<
      Api['events']['lifecycleOperations']['setLifecycle']
    >(api.events.lifecycleOperations.setLifecycle);
  }
  return { useEventLifecycle, useSetEventLifecycle };
}
