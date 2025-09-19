// ============================================================================
// EVENT HOOKS - LEGACY FILE
// ============================================================================
// Event mutations have been moved to packages/hooks/src/mutations/event.ts
// This file now re-exports them for backward compatibility

export {
  useCreateEvent,
  useUpdateEventDetails,
  useUpdateEventDateTime,
  useUpdateEventPotentialDateTimes,
  useDeleteEvent,
  useLeaveEvent,
} from '../mutations/event';
