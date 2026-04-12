import {
  createEventDataHooks,
  createEventActionHooks,
  createEventHooks,
} from '@groupi/shared/hooks';

// Lazy-load API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

const eventDataHooks = createEventDataHooks(api);
const eventActionHooks = createEventActionHooks(api);
const eventHooks = createEventHooks(api);

export const {
  useUserEvents,
  useEventHeader,
  useEventMembers,
  useEventAvailability,
  useCanManageEvent,
  useEventLoadingStates,
  useMutualEvents,
} = eventDataHooks;

export const {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useJoinEvent,
  useLeaveEvent,
  useUpdateRSVP,
  useEventActions,
  useEventManagement,
} = eventActionHooks;

export { eventHooks };
