/* eslint-disable no-redeclare */
import { z } from 'zod';
import { UserSchema, MembershipSchema, EventSchema } from '../generated';

// ============================================================================
// PERSON DOMAIN DATA DTOS
// ============================================================================

// Basic person DTO - uses User table for auth data
export const PersonBasicDTO = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
});

export type PersonBasicDTO = z.infer<typeof PersonBasicDTO>;

// Author DTO - for displaying post/reply authors
export const AuthorDTO = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
});

export type AuthorDTO = z.infer<typeof AuthorDTO>;

// User dashboard DTO - for main user profile/dashboard
export const UserDashboardDTO = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
  imageKey: true,
  pronouns: true,
  bio: true,
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
export const UserProfileDTO = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
});

export type UserProfileDTO = z.infer<typeof UserProfileDTO>;

// ============================================================================
// ADMIN-SPECIFIC DTOS
// ============================================================================

// User admin list item DTO - for admin dashboard
export const UserAdminListItemDTO = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  username: z.string().nullable(),
  displayUsername: z.string().nullable(),
  role: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    memberships: z.number(),
    posts: z.number(),
    replies: z.number(),
  }),
});

export type UserAdminListItemDTO = z.infer<typeof UserAdminListItemDTO>;
