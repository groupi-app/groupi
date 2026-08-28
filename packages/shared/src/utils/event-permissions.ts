export type EventRole = 'ATTENDEE' | 'MODERATOR' | 'ORGANIZER';
export type PermissionLevel = 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
export type EventPermissionKey =
  | 'createPosts'
  | 'inviteMembers'
  | 'viewAttendeeList';
export type EventPermissions = Record<EventPermissionKey, PermissionLevel>;

const ROLE_HIERARCHY: Record<EventRole, number> = {
  ATTENDEE: 1,
  MODERATOR: 2,
  ORGANIZER: 3,
};

export const DEFAULT_EVENT_PERMISSIONS: EventPermissions = {
  createPosts: 'EVERYONE',
  inviteMembers: 'MODERATOR',
  viewAttendeeList: 'EVERYONE',
};

export const PERMISSION_LABELS: Record<EventPermissionKey, string> = {
  createPosts: 'Create posts',
  inviteMembers: 'Invite members',
  viewAttendeeList: 'View attendee list',
};

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  EVERYONE: 'Everyone',
  MODERATOR: 'Mods & Organizers',
  ORGANIZER: 'Organizer only',
};

export function hasPermission(
  userRole: EventRole | undefined,
  requiredLevel: PermissionLevel
): boolean {
  if (!userRole) return false;

  const requiredRole =
    requiredLevel === 'EVERYONE' ? 'ATTENDEE' : requiredLevel;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canCreatePosts(
  userRole: EventRole | undefined,
  permissions: EventPermissions | undefined
): boolean {
  return Boolean(
    permissions && hasPermission(userRole, permissions.createPosts)
  );
}

export function canInviteMembers(
  userRole: EventRole | undefined,
  permissions: EventPermissions | undefined
): boolean {
  return Boolean(
    permissions && hasPermission(userRole, permissions.inviteMembers)
  );
}

export function canViewAttendeeList(
  userRole: EventRole | undefined,
  permissions: EventPermissions | undefined
): boolean {
  return Boolean(
    permissions && hasPermission(userRole, permissions.viewAttendeeList)
  );
}
