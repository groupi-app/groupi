/* eslint-disable no-redeclare */
import { z } from 'zod';
import type { Person as PrismaPerson, Membership } from '../generated';
import {
  RoleSchema,
  StatusSchema,
  PersonSchema,
  MembershipSchema,
} from '../generated';

// Base person DTO - the foundation for all person-related DTOs
export const PersonBasicDTO = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
});

export type PersonBasicDTO = z.infer<typeof PersonBasicDTO>;

// Author DTO - for post authors, notification authors, etc.
export const AuthorDTO = PersonBasicDTO;
export type AuthorDTO = z.infer<typeof AuthorDTO>;

// Member DTO - for event members with role and RSVP info
export const MemberDTO = MembershipSchema.pick({
  id: true,
  role: true,
  rsvpStatus: true,
}).extend({
  person: PersonBasicDTO,
});

export type MemberDTO = z.infer<typeof MemberDTO>;

// User context DTO - for current user with optional role
export const UserContextDTO = PersonBasicDTO.extend({
  role: RoleSchema.optional(),
});

export type UserContextDTO = z.infer<typeof UserContextDTO>;

// Types for Prisma data
export type MemberWithPerson = Membership & {
  person: PrismaPerson;
};

export type PrismaUserDashboard = PrismaPerson & {
  memberships: Array<
    Membership & {
      event: {
        id: string;
        title: string;
        memberships: Array<
          Membership & {
            person: PrismaPerson;
          }
        >;
      };
    }
  >;
};

// User dashboard DTO - for user's profile/dashboard view showing their events
export const UserDashboardDTO = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string(),
  imageUrl: z.string(),
  memberships: z.array(
    z.object({
      id: z.string(),
      role: RoleSchema,
      rsvpStatus: StatusSchema,
      event: z.object({
        id: z.string(),
        title: z.string(),
        memberships: z.array(
          z.object({
            id: z.string(),
            role: RoleSchema,
            rsvpStatus: StatusSchema,
            person: PersonBasicDTO,
          })
        ),
      }),
    })
  ),
});

export type UserDashboardDTO = z.infer<typeof UserDashboardDTO>;

// Factory functions
export function createPersonBasicDTO(person: PrismaPerson): PersonBasicDTO {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    username: person.username,
    imageUrl: person.imageUrl,
  };
}

// Alias for backward compatibility and clarity
export const createAuthorDTO = createPersonBasicDTO;

export function createMemberDTO(memberWithPerson: MemberWithPerson): MemberDTO {
  return {
    id: memberWithPerson.id,
    role: memberWithPerson.role,
    rsvpStatus: memberWithPerson.rsvpStatus,
    person: createPersonBasicDTO(memberWithPerson.person),
  };
}

export function createUserContextDTO(
  person: PrismaPerson,
  role?: string
): UserContextDTO {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    username: person.username,
    imageUrl: person.imageUrl,
    role: role as any,
  };
}

export function createUserDashboardDTO(
  person: PrismaUserDashboard
): UserDashboardDTO {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    username: person.username,
    imageUrl: person.imageUrl,
    memberships: person.memberships.map(membership => ({
      id: membership.id,
      role: membership.role,
      rsvpStatus: membership.rsvpStatus,
      event: {
        id: membership.event.id,
        title: membership.event.title,
        memberships: membership.event.memberships.map(eventMembership => ({
          id: eventMembership.id,
          role: eventMembership.role,
          rsvpStatus: eventMembership.rsvpStatus,
          person: createPersonBasicDTO(eventMembership.person),
        })),
      },
    })),
  };
}

// Backward compatibility aliases
export const UserInfoDTO = UserContextDTO;
export type UserInfoDTO = UserContextDTO;
export const createUserInfoDTO = createUserContextDTO;
