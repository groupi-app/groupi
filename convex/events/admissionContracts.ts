import { v } from 'convex/values';

export const admissionPolicyValidator = v.union(
  v.literal('INVITATION_ONLY'),
  v.literal('DIRECT'),
  v.literal('APPLY')
);

export const logisticsEventValidator = v.object({
  _id: v.id('events'),
  _creationTime: v.number(),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  location: v.union(v.string(), v.null()),
  creatorId: v.id('persons'),
  timezone: v.string(),
  visibility: v.union(
    v.literal('PRIVATE'),
    v.literal('FRIENDS'),
    v.literal('PUBLIC')
  ),
  admissionPolicy: admissionPolicyValidator,
  chosenDateTime: v.union(v.number(), v.null()),
  chosenEndDateTime: v.union(v.number(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  imageFocalPoint: v.optional(v.object({ x: v.number(), y: v.number() })),
  createdAt: v.number(),
  updatedAt: v.number(),
  potentialDateTimeOptions: v.array(
    v.object({
      id: v.id('potentialDateTimes'),
      start: v.number(),
      end: v.union(v.number(), v.null()),
      note: v.union(v.string(), v.null()),
    })
  ),
});
export const eventLogisticsValidator = v.object({
  event: logisticsEventValidator,
  organizer: v.union(
    v.object({
      personId: v.id('persons'),
      name: v.union(v.string(), v.null()),
      username: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
    }),
    v.null()
  ),
  entryAction: v.union(
    v.literal('MEMBER'),
    v.literal('JOIN'),
    v.literal('APPLY'),
    v.literal('INVITATION_ONLY'),
    v.literal('SIGN_IN'),
    v.literal('UNAVAILABLE')
  ),
});
export const admissionPolicyResultValidator = v.object({
  eventId: v.id('events'),
  admissionPolicy: admissionPolicyValidator,
});
