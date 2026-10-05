import { questionValidator } from '../eventApplications/contracts';
import { status as questionnaireStatus } from '../groupQuestionnaires/contracts';
import { v } from 'convex/values';
export const role = v.union(
  v.literal('OWNER'),
  v.literal('MODERATOR'),
  v.literal('MEMBER')
);
export const identityInput = {
  name: v.string(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
};
export const updateInput = {
  groupId: v.id('groups'),
  name: v.optional(v.string()),
  description: v.optional(v.union(v.string(), v.null())),
  image: v.optional(v.union(v.string(), v.null())),
};
export const group = v.object({
  joiningQuestionnaire: questionnaireStatus,
  _id: v.id('groups'),
  _creationTime: v.number(),
  ownerId: v.id('persons'),
  name: v.string(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  role,
  viewerRole: role,
  canManageIdentity: v.boolean(),
  canManageInvitations: v.boolean(),
  canManageMembers: v.boolean(),
  canManageRoles: v.boolean(),
  canLeave: v.boolean(),
  invitationsEnabled: v.boolean(),
  applicationsEnabled: v.boolean(),
  applicationQuestions: v.array(questionValidator),
  memberCount: v.number(),
  eventSharingPolicy: v.union(v.literal('MANAGERS'), v.literal('MEMBERS')),
  canShareEvents: v.boolean(),
});
export const landing = v.object({
  groupId: v.id('groups'),
  name: v.string(),
  description: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});
export const page = v.object({
  page: v.array(group),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
