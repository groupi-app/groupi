import { v } from 'convex/values';
import { reminderOffsetValidator } from './writes';
const permissionLevelValidator = v.union(
  v.literal('EVERYONE'),
  v.literal('MODERATOR'),
  v.literal('ORGANIZER')
);
export const dateSelectionSourceValidator = v.union(
  v.literal('POLL'),
  v.literal('MANUAL')
);

export const eventDocumentValidator = v.object({
  _id: v.id('events'),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  imageStorageId: v.optional(v.id('_storage')),
  imageFocalPoint: v.optional(
    v.object({
      x: v.number(),
      y: v.number(),
    })
  ),
  chosenDateTime: v.optional(v.number()),
  chosenEndDateTime: v.optional(v.number()),
  creatorId: v.id('persons'),
  createdById: v.optional(v.id('persons')),
  memberCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
  timezone: v.string(),
  potentialDateTimes: v.array(v.number()),
  visibility: v.optional(
    v.union(v.literal('PRIVATE'), v.literal('FRIENDS'), v.literal('PUBLIC'))
  ),
  reminderOffset: v.optional(reminderOffsetValidator),
  permissions: v.optional(
    v.object({
      createPosts: v.optional(permissionLevelValidator),
      inviteMembers: v.optional(permissionLevelValidator),
      viewAttendeeList: v.optional(permissionLevelValidator),
    })
  ),
});
