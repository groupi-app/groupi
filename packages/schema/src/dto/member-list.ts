import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  PersonSchema,
  RoleSchema,
  StatusSchema,
} from '../generated';
import { createResultTuple } from '../result-tuple';

// ============================================================================
// MEMBER LIST COMPONENT SCHEMAS
// ============================================================================

/**
 * Schema for the MemberList component data
 * Contains only the fields needed for displaying members
 * Based on generated Prisma schemas
 */
export const MemberListDataSchema = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
      }).extend({
        person: PersonSchema.pick({
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        }),
      })
    ),
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
  }),
  userId: z.string(),
});

export type MemberListData = z.infer<typeof MemberListDataSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export const MemberListErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('EventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotMemberError'),
    message: z.string(),
  }),
]);

export type MemberListError = z.infer<typeof MemberListErrorSchema>;

// ============================================================================
// RESULT TUPLE - Discriminated Union (Error OR Data, never both, never neither)
// ============================================================================

export const MemberListResultSchema = createResultTuple(
  MemberListErrorSchema,
  MemberListDataSchema
);

export type MemberListResult = z.infer<typeof MemberListResultSchema>;
