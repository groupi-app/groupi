import { v } from 'convex/values';
import schema from '../schema';
export const membershipDocumentValidator = v.object({
  _id: v.id('memberships'),
  _creationTime: v.number(),
  ...schema.tables.memberships.validator.fields,
});
export const rsvpStatus = v.union(
  v.literal('YES'),
  v.literal('MAYBE'),
  v.literal('NO'),
  v.literal('PENDING')
);
export const responseStatus = v.union(
  v.literal('YES'),
  v.literal('MAYBE'),
  v.literal('NO')
);
export const publicUser = v.object({
  id: v.string(),
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
});
export const potentialDate = v.object({
  id: v.id('potentialDateTimes'),
  dateTime: v.number(),
  endDateTime: v.union(v.number(), v.null()),
  note: v.union(v.string(), v.null()),
});
export const ownResponse = v.object({
  potentialDateTime: potentialDate,
  status: rsvpStatus,
  note: v.union(v.string(), v.null()),
  availabilityId: v.union(v.id('availabilities'), v.null()),
});
export const memberResponse = v.object({
  membershipId: v.id('memberships'),
  personId: v.id('persons'),
  user: v.union(publicUser, v.null()),
  status: rsvpStatus,
  note: v.union(v.string(), v.null()),
});
export const attendanceMember = v.object({
  id: v.id('memberships'),
  personId: v.id('persons'),
  role: v.union(
    v.literal('ATTENDEE'),
    v.literal('MODERATOR'),
    v.literal('ORGANIZER')
  ),
  rsvpStatus,
  rsvpNote: v.union(v.string(), v.null()),
  joinedAt: v.number(),
  user: v.union(publicUser, v.null()),
});
export const ownRsvp = v.object({
  membershipId: v.id('memberships'),
  rsvpStatus,
  rsvpNote: v.union(v.string(), v.null()),
});
export const gridEntry = v.object({
  potentialDateTime: potentialDate,
  availabilities: v.array(
    v.object({
      membershipId: v.id('memberships'),
      user: publicUser,
      status: rsvpStatus,
      note: v.union(v.string(), v.null()),
    })
  ),
  summary: v.object({
    yes: v.number(),
    maybe: v.number(),
    no: v.number(),
    pending: v.number(),
  }),
});
