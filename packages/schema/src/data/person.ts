/* eslint-disable no-redeclare */
import { z } from 'zod';
import { PersonSchema, MembershipSchema, EventSchema } from '../generated';

// ============================================================================
// PERSON DOMAIN DATA DTOS
// ============================================================================

// Basic person DTO - the foundation for all person-related DTOs
export const PersonBasicDTO = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
});

export type PersonBasicDTO = z.infer<typeof PersonBasicDTO>;

// Author DTO - for displaying post/reply authors
export const AuthorDTO = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
});

export type AuthorDTO = z.infer<typeof AuthorDTO>;

// User dashboard DTO - for main user profile/dashboard
export const UserDashboardDTO = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  memberships: z.array(
    MembershipSchema.pick({
      id: true,
      role: true,
      rsvpStatus: true,
    }).extend({
      event: EventSchema.pick({
        id: true,
        title: true,
        description: true,
        location: true,
        chosenDateTime: true,
        createdAt: true,
        updatedAt: true,
      }),
    })
  ),
});

export type UserDashboardDTO = z.infer<typeof UserDashboardDTO>;

// User profile DTO - for profile pages
export const UserProfileDTO = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
  createdAt: true,
});

export type UserProfileDTO = z.infer<typeof UserProfileDTO>;
