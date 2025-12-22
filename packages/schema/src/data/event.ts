/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  UserSchema,
  AvailabilitySchema,
  PotentialDateTimeSchema,
} from '../generated';

// ============================================================================
// EVENT DOMAIN DATA TYPES
// ============================================================================

// Event header data for event page header
export const EventHeaderData = z.object({
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

export type EventHeaderData = z.infer<typeof EventHeaderData>;

// Detailed event data for SSR pages and basic event operations
export const EventDetailsData = EventHeaderData.extend({
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
          username: true,
        }),
      }),
    })
  ),
});

export type EventDetailsData = z.infer<typeof EventDetailsData>;

// ============================================================================
// PAGE-SPECIFIC DATA TYPES
// ============================================================================

// Event new post page data
export const EventNewPostPageData = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
  }),
  userRole: MembershipSchema.shape.role,
});

export type EventNewPostPageData = z.infer<typeof EventNewPostPageData>;

// Event attendees page data
export const EventAttendeesPageData = z.object({
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
            username: true,
          }),
        }),
        availabilities: z
          .array(
            AvailabilitySchema.pick({
              status: true,
              membershipId: true,
              potentialDateTimeId: true,
            }).extend({
              potentialDateTime: PotentialDateTimeSchema.pick({
                id: true,
                eventId: true,
                dateTime: true,
              }),
            })
          )
          .optional(),
      })
    ),
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    rsvpStatus: true,
  }),
  userId: z.string(),
});

export type EventAttendeesPageData = z.infer<typeof EventAttendeesPageData>;

// ============================================================================
// ADMIN-SPECIFIC DATA TYPES
// ============================================================================

// Event admin list item data - for admin dashboard
export const EventAdminListItemData = EventSchema.pick({
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

export type EventAdminListItemData = z.infer<typeof EventAdminListItemData>;

// Mutual events data - events where both users are members
export const MutualEventsData = z.array(
  EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
    createdAt: true,
    updatedAt: true,
  })
);

export type MutualEventsData = z.infer<typeof MutualEventsData>;
