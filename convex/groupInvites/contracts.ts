import { status as questionnaireStatus } from '../groupQuestionnaires/contracts';
import { v } from 'convex/values';
import { role } from '../groups/contracts';
export const status = v.union(
  v.literal('PENDING'),
  v.literal('ACCEPTED'),
  v.literal('DECLINED'),
  v.literal('CANCELLED')
);
export const person = v.object({
  personId: v.id('persons'),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});
export const summary = v.object({
  inviteId: v.id('groupInvites'),
  status,
  createdAt: v.number(),
  respondedAt: v.union(v.number(), v.null()),
  group: v.object({
    groupId: v.id('groups'),
    name: v.string(),
    description: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
  }),
  inviter: person,
  invitee: person,
  available: v.boolean(),
  canBan: v.boolean(),
});
export const page = v.object({
  page: v.array(summary),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const member = v.object({
  ...person.fields,
  role,
  joinedAt: v.number(),
  canRemove: v.boolean(),
  canBan: v.boolean(),
  canChangeRole: v.boolean(),
});
export const memberPage = v.object({
  page: v.array(member),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const sent = v.object({
  inviteId: v.id('groupInvites'),
  status: v.literal('PENDING'),
});
export const accepted = v.object({
  joiningQuestionnaire: questionnaireStatus,
  groupId: v.id('groups'),
  membershipId: v.id('groupMemberships'),
  status: v.literal('ACCEPTED'),
});
