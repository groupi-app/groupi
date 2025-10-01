/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  PersonSchema,
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
  owner: PersonSchema.pick({
    firstName: true,
    lastName: true,
    username: true,
    imageUrl: true,
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
        author: PersonSchema.pick({
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        }),
      })
      .extend({
        replies: z.array(
          ReplySchema.pick({
            id: true,
            text: true,
          }).extend({
            author: PersonSchema.pick({
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              imageUrl: true,
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
});

export type EventAttendeesPageDTO = z.infer<typeof EventAttendeesPageDTO>;
