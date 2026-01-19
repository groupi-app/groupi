/**
 * Shared constants for the Convex backend
 */

/**
 * User roles for the application
 * Used by Better Auth admin plugin
 */
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/**
 * Check if a role string represents an admin
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Event membership roles
 */
export const MembershipRole = {
  ORGANIZER: 'ORGANIZER',
  MODERATOR: 'MODERATOR',
  ATTENDEE: 'ATTENDEE',
} as const;

export type MembershipRoleType =
  (typeof MembershipRole)[keyof typeof MembershipRole];

/**
 * RSVP status options
 */
export const RsvpStatus = {
  YES: 'YES',
  MAYBE: 'MAYBE',
  NO: 'NO',
  PENDING: 'PENDING',
} as const;

export type RsvpStatusType = (typeof RsvpStatus)[keyof typeof RsvpStatus];
