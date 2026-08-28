import {
  createEventDataHooks,
  createEventActionHooks,
  createEventHooks,
} from '@groupi/shared/hooks';
import { api } from 'convex/_generated/api';

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
