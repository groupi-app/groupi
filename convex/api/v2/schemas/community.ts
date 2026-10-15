import { z } from '@hono/zod-openapi';
import { GroupApplicationQuestionSchema } from './groupApplications';
const status = z.enum(['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']);
export const CommunityContextSchema = z.object({
  contractVersion: z.literal('red-room.v1'),
  group: z.object({ id: z.string(), name: z.string() }),
  form: z.object({
    enabled: z.boolean(),
    revision: z.string(),
    questions: z.array(GroupApplicationQuestionSchema),
  }),
  membership: z
    .object({ role: z.enum(['OWNER', 'MODERATOR', 'MEMBER']) })
    .nullable(),
  eligibility: z.object({
    canApply: z.boolean(),
    canAccessMemberContent: z.boolean(),
    banned: z.boolean(),
  }),
  applications: z.array(
    z.object({
      id: z.string(),
      status,
      revision: z.number(),
      questions: z.array(GroupApplicationQuestionSchema),
      answers: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
      ),
      submittedAt: z.number(),
      decisions: z.array(z.object({ status, at: z.number() })),
    })
  ),
  nextCursor: z.string().nullable(),
  grantedActions: z.array(z.string()),
  allowedActions: z.array(z.string()),
  announcementPreference: z.object({
    supported: z.literal(false),
    subscribed: z.null(),
  }),
});

export const CurrentCommunityEventSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('conflict'),
    code: z.literal('STAFF_CONFIGURATION_CONFLICT'),
  }),
  z.object({
    kind: z.literal('event'),
    supportedRsvpChoices: z.array(z.enum(['PENDING', 'YES', 'NO', 'MAYBE'])),
    allowedRsvpTransitions: z.array(z.enum(['PENDING', 'YES', 'NO', 'MAYBE'])),
    event: z.object({
      id: z.string(),
      title: z.string(),
      location: z.string().nullable(),
      description: z.string().nullable(),
      timezone: z.string(),
      startsAt: z.number().nullable(),
      endsAt: z.number().nullable(),
      ongoing: z.boolean(),
      roster: z.array(z.object({ displayName: z.string() })).nullable(),
    }),
    participation: z
      .object({
        membershipId: z.string(),
        revision: z.number(),
        rsvp: z.enum(['PENDING', 'YES', 'NO', 'MAYBE']),
      })
      .nullable(),
    allowedActions: z.array(z.string()),
  }),
]);
