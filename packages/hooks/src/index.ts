// ============================================================================
// QUERY HOOKS
// ============================================================================

// Notification queries (the only non-page-specific queries still in use)
export {
  useNotifications,
  useUnreadNotificationCount,
} from './queries/notification';

// Page-specific queries
export {
  useEventHeader,
  useMemberList,
  usePostFeed,
} from './queries/pages/event-page';
export { useMyEvents } from './queries/pages/my-events';
export { useInvitePage } from './queries/pages/invite-page';
export { usePostDetail } from './queries/pages/post-detail';
export { useSettingsPage } from './queries/pages/settings-page';
export { useEventInvites } from './queries/pages/event-invite-page';
export { useEventAttendees } from './queries/pages/event-attendees-page';
export { useEventAvailability } from './queries/pages/event-availability-page';
export { useEventNewPost } from './queries/pages/event-new-post-page';
export { useEventEdit } from './queries/pages/event-edit-page';
export {
  useEventDateSelect,
  usePDTs,
} from './queries/pages/event-date-select-page';
export { useEventChangeDate } from './queries/pages/event-change-date-page';
export { useEventChangeDateSingle } from './queries/pages/event-change-date-single-page';
export { useEventChangeDateMulti } from './queries/pages/event-change-date-multi-page';

// ============================================================================
// MUTATION HOOKS
// ============================================================================

// Event mutations
export {
  useCreateEvent,
  useUpdateEventDetails,
  useUpdateEventDateTime,
  useUpdateEventPotentialDateTimes,
  useDeleteEvent,
  useLeaveEvent,
} from './mutations/event';

// Post mutations
export {
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useCreateReply,
  useUpdateReply,
  useDeleteReply,
} from './mutations/post';

// Invite mutations
export {
  useCreateInvite,
  useDeleteInvite,
  useDeleteManyInvites,
  useAcceptInvite,
} from './mutations/invite';

// Notification mutations
export {
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useMarkEventNotificationsAsRead,
} from './mutations/notification';

// Availability mutations
export {
  useUpdateMemberAvailabilities,
  useChooseDateTime,
} from './mutations/availability';

// Settings mutations
export { useUpdateUserSettings } from './mutations/settings';
// Alias for backward compatibility
export { useUpdateUserSettings as useUpdateDefaultNotifMethod } from './mutations/settings';

// ============================================================================
// REAL-TIME UTILITIES
// ============================================================================

export { useSupabaseRealtime } from './realtime/use-supabase-realtime';

// ============================================================================
// CLIENTS
// ============================================================================

export { api } from './clients/trpc-client';
export { getSupabaseClient } from './clients/supabase-client';
