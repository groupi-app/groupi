/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  UserSchema,
  PostSchema,
  ReplySchema,
} from '../generated';

// ============================================================================
// EVENT DOMAIN DATA DTOS
// ============================================================================

// Minimal event DTO for cards and lists
export const EventCardDTO = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  memberCount: z.number(),
  owner: UserSchema.pick({
    name: true,
    email: true,
    image: true,
  }),
});

export type EventCardDTO = z.infer<typeof EventCardDTO>;

// Event header DTO for event page header
export const EventHeaderDTO = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    rsvpStatus: true,
  }),
});

export type EventHeaderDTO = z.infer<typeof EventHeaderDTO>;

// Detailed event DTO for SSR pages and basic event operations
export const EventDetailsDTO = EventHeaderDTO.extend({
  memberships: z.array(
    MembershipSchema.pick({
      id: true,
      personId: true,
      eventId: true,
      role: true,
      rsvpStatus: true,
    }).extend({
      person: z.object({
        id: z.string(),
        user: UserSchema.pick({
          name: true,
          email: true,
          image: true,
        }),
      }),
    })
  ),
});

export type EventDetailsDTO = z.infer<typeof EventDetailsDTO>;

// Event DTO with posts for event page
export const EventPageDTO = EventDetailsDTO.extend({
  posts: z.array(
    PostSchema.pick({
      id: true,
      title: true,
      content: true,
      authorId: true,
      eventId: true,
    })
      .extend({
        author: z.object({
          id: z.string(),
          user: UserSchema.pick({
            name: true,
            email: true,
            image: true,
          }),
        }),
      })
      .extend({
        replies: z.array(
          ReplySchema.pick({
            id: true,
            text: true,
          }).extend({
            author: z.object({
              id: z.string(),
              user: UserSchema.pick({
                name: true,
                email: true,
                image: true,
              }),
            }),
          })
        ),
      })
  ),
});

export type EventPageDTO = z.infer<typeof EventPageDTO>;

// ============================================================================
// PAGE-SPECIFIC DTOS
// ============================================================================

// Event new post page DTO
export const EventNewPostPageDTO = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
  }),
  userRole: MembershipSchema.shape.role,
});

export type EventNewPostPageDTO = z.infer<typeof EventNewPostPageDTO>;

// Event attendees page DTO
export const EventAttendeesPageDTO = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
    chosenDateTime: true,
  }).extend({
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
        personId: true,
        eventId: true,
      }).extend({
        person: z.object({
          id: z.string(),
          user: UserSchema.pick({
            name: true,
            email: true,
            image: true,
          }),
        }),
      })
    ),
  }),
});

export type EventAttendeesPageDTO = z.infer<typeof EventAttendeesPageDTO>;

// ============================================================================
// ADMIN-SPECIFIC DTOS
// ============================================================================

// Event admin list item DTO - for admin dashboard
export const EventAdminListItemDTO = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  organizer: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }).nullable(),
  _count: z.object({
    memberships: z.number(),
    posts: z.number(),
  }),
});

export type EventAdminListItemDTO = z.infer<typeof EventAdminListItemDTO>;
