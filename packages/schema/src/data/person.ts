/* eslint-disable no-redeclare */
import { z } from 'zod';
import { UserSchema, MembershipSchema, EventSchema } from '../generated';

// ============================================================================
// PERSON DOMAIN DATA TYPES
// ============================================================================

// Basic person data - uses User table for auth data
export const PersonBasicData = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
});

export type PersonBasicData = z.infer<typeof PersonBasicData>;

// Author data - for displaying post/reply authors
export const AuthorData = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
});

export type AuthorData = z.infer<typeof AuthorData>;

// User dashboard data - for main user profile/dashboard
export const UserDashboardData = UserSchema.pick({
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

export type UserDashboardData = z.infer<typeof UserDashboardData>;

// ============================================================================
// ADMIN-SPECIFIC DATA TYPES
// ============================================================================

// User admin list item data - for admin dashboard
export const UserAdminListItemData = z.object({
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

export type UserAdminListItemData = z.infer<typeof UserAdminListItemData>;
