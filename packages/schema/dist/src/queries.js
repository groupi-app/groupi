export const getEventQuery = (eventId) => {
    return {
        queryKey: `eventData__${eventId}`,
        pusherChannel: `event__${eventId}`,
        pusherEvent: 'update_event_data',
    };
};
export const getPostQuery = (postId) => {
    return {
        queryKey: `postData__${postId}`,
        pusherChannel: `post__${postId}`,
        pusherEvent: 'update_post_data',
    };
};
export const getInviteQuery = (eventId) => {
    return {
        queryKey: `inviteData__${eventId}`,
        pusherChannel: `invite__${eventId}`,
        pusherEvent: 'update_invite_data',
    };
};
export const getPersonQuery = (personId) => {
    return {
        queryKey: `personData__${personId}`,
        pusherChannel: `person__${personId}`,
        pusherEvent: 'update_person_data',
    };
};
export const getPDTQuery = (eventId) => {
    return {
        queryKey: `pdtData__${eventId}`,
        pusherChannel: `pdt__${eventId}`,
        pusherEvent: 'update_pdt_data',
    };
};
export const getNotificationQuery = (userId) => {
    return {
        queryKey: `notificationData__${userId}`,
        pusherChannel: `notification__${userId}`,
        pusherEvent: 'update_notification_data',
    };
};
export const getSettingsQuery = (userId) => {
    return {
        queryKey: `settingsData__${userId}`,
        pusherChannel: `settings__${userId}`,
        pusherEvent: 'update_settings_data',
    };
};
