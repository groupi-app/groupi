/**
 * Platform-agnostic hooks for Groupi
 * These hooks work identically on web and mobile platforms
 */

// Authentication hooks
export * from './useAuth';

// Event data hooks
export * from './useEventData';

// Event action hooks
export * from './useEventActions';

// Post data hooks
export * from './usePostData';

// Post action hooks
export * from './usePostActions';

// Type exports
export type { ConvexApi, ConvexDataModel, ConvexId } from './types';

// Combined hook factories for convenience
import { createEventDataHooks } from './useEventData';
import { createEventActionHooks } from './useEventActions';
import type { ConvexApi } from './types';

/**
 * Combined event hooks factory - combines data and action hooks
 * Use this for convenience when you need both queries and mutations
 */
export function createEventHooks(api: ConvexApi) {
  const dataHooks = createEventDataHooks(api);
  const actionHooks = createEventActionHooks(api);

  return {
    ...dataHooks,
    ...actionHooks,
  };
}
