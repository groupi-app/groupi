import type { NotificationType } from '@/convex/types';

/**
 * Gets the display name for a notification type
 */
export function getNotificationTypeDisplayName(type: NotificationType): string {
  const displayNames: Record<NotificationType, string> = {
    EVENT_EDITED: 'Event Edited',
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
  };

  return displayNames[type] || type;
}
