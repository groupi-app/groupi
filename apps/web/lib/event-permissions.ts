import type { RoleType } from '@groupi/schema';

/**
 * Event permissions utility functions
 * Centralized logic for checking what actions users can perform based on their role
 */

/**
 * Check if a user can delete a post
 * - Authors can always delete their own posts
 * - Moderators and Organizers can delete any post in their event
 * - Regular attendees can only delete their own posts
 */
export function canDeletePost({
  userId,
  userRole,
  postAuthorId,
}: {
  userId: string;
  userRole: RoleType;
  postAuthorId: string;
}): boolean {
  // Authors can always delete their own posts
  if (userId === postAuthorId) {
    return true;
  }

  // Moderators and Organizers can delete any post
  if (userRole === 'MODERATOR' || userRole === 'ORGANIZER') {
    return true;
  }

  // Regular attendees cannot delete other people's posts
  return false;
}

/**
 * Check if a user can edit a post
 * - Authors can always edit their own posts
 * - Moderators and Organizers cannot edit other people's posts (only delete)
 */
export function canEditPost({
  userId,
  postAuthorId,
}: {
  userId: string;
  postAuthorId: string;
}): boolean {
  // Only authors can edit their own posts
  return userId === postAuthorId;
}

/**
 * Check if a user can delete a reply
 * - Authors can always delete their own replies
 * - Moderators and Organizers can delete any reply in their event
 * - Regular attendees can only delete their own replies
 */
export function canDeleteReply({
  userId,
  userRole,
  replyAuthorId,
}: {
  userId: string;
  userRole: RoleType;
  replyAuthorId: string;
}): boolean {
  // Authors can always delete their own replies
  if (userId === replyAuthorId) {
    return true;
  }

  // Moderators and Organizers can delete any reply
  if (userRole === 'MODERATOR' || userRole === 'ORGANIZER') {
    return true;
  }

  // Regular attendees cannot delete other people's replies
  return false;
}

/**
 * Check if a user can edit a reply
 * - Authors can always edit their own replies
 * - Moderators and Organizers cannot edit other people's replies (only delete)
 */
export function canEditReply({
  userId,
  replyAuthorId,
}: {
  userId: string;
  replyAuthorId: string;
}): boolean {
  // Only authors can edit their own replies
  return userId === replyAuthorId;
}

/**
 * Check if a user has moderator privileges (MODERATOR or ORGANIZER)
 */
export function isModerator(userRole: RoleType): boolean {
  return userRole === 'MODERATOR' || userRole === 'ORGANIZER';
}

/**
 * Check if a user is an organizer
 */
export function isOrganizer(userRole: RoleType): boolean {
  return userRole === 'ORGANIZER';
}

