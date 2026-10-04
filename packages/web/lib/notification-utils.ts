import type { NotificationType } from '@/convex/types';

/**
 * Gets the display name for a notification type
 */
export function getNotificationTypeDisplayName(type: NotificationType): string {
  const displayNames: Record<NotificationType, string> = {
    EVENT_EDITED: 'Event Edited',
    EVENT_APPLICATION_RECEIVED: 'Application Received',
    EVENT_APPLICATION_APPROVED: 'Application Approved',
    EVENT_APPLICATION_DECLINED: 'Application Declined',
    DATE_CHANGED: 'Date Changed',
    DATE_CHOSEN: 'Date Chosen',
    DATE_RESET: 'Date Reset',
    USER_JOINED: 'User Joined',
    USER_LEFT: 'User Left',
    USER_PROMOTED: 'User Promoted',
    USER_DEMOTED: 'User Demoted',
    USER_RSVP: 'User RSVP',
    NEW_POST: 'New Post',
    NEW_REPLY: 'New Reply',
    USER_MENTIONED: 'Mentioned',
    EVENT_REMINDER: 'Event Reminder',
    ADDON_CONFIG_RESET: 'Add-on Updated',
    GROUP_APPLICATION_RECEIVED: 'Group Application Received',
    GROUP_APPLICATION_APPROVED: 'Group Application Approved',
    GROUP_APPLICATION_DECLINED: 'Group Application Declined',
    GROUP_MEMBER_REMOVED: 'Removed from Group',
    GROUP_MEMBER_BANNED: 'Banned from Group',
    GROUP_INVITE_RECEIVED: 'Group Invitation Received',
    GROUP_INVITE_ACCEPTED: 'Group Invitation Accepted',
  };

  return displayNames[type] || type;
}
