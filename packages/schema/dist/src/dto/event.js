import { z } from 'zod';
import { RoleSchema, StatusSchema, EventSchema, MembershipSchema, PersonSchema, } from '../generated';
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
// Event header DTO for event page header
export const EventHeaderDTO = EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
}).extend({
    userMembership: z.object({
        role: RoleSchema,
        rsvpStatus: StatusSchema,
    }),
});
// Detailed event DTO for SSR pages and basic event operations
export const EventDetailsDTO = EventHeaderDTO.extend({
    memberships: z.array(MembershipSchema.pick({
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
    })),
});
// Event DTO with posts for event page
export const EventPageDTO = EventDetailsDTO.extend({
    posts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
        eventId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        replies: z.array(z.object({
            id: z.string(),
            text: z.string(),
            authorId: z.string(),
            postId: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
            author: z.object({
                id: z.string(),
                firstName: z.string().nullable(),
                lastName: z.string().nullable(),
                username: z.string(),
                imageUrl: z.string(),
            }),
        })),
        author: z.object({
            id: z.string(),
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
            username: z.string(),
            imageUrl: z.string(),
        }),
    })),
});
// Factory functions to create DTOs from Prisma data
export function createEventCardDTO(event, memberships) {
    var _a;
    const owner = (_a = memberships.find(m => m.role === 'ORGANIZER')) === null || _a === void 0 ? void 0 : _a.person;
    if (!owner) {
        throw new Error('Event must have an organizer');
    }
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        memberCount: memberships.length,
        owner: {
            firstName: owner.firstName,
            lastName: owner.lastName,
            username: owner.username,
            imageUrl: owner.imageUrl,
        },
    };
}
export function createEventHeaderDTO(event, userMembership) {
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        userMembership: {
            role: userMembership.role,
            rsvpStatus: userMembership.rsvpStatus,
        },
    };
}
export function createEventDetailsDTO(eventWithMembers, currentUserId) {
    var _a, _b;
    const userMembership = (_a = eventWithMembers.memberships) === null || _a === void 0 ? void 0 : _a.find((m) => m.personId === currentUserId);
    return {
        id: eventWithMembers.id,
        title: eventWithMembers.title,
        description: eventWithMembers.description,
        location: eventWithMembers.location,
        chosenDateTime: eventWithMembers.chosenDateTime,
        userMembership: {
            role: (userMembership === null || userMembership === void 0 ? void 0 : userMembership.role) || 'ATTENDEE',
            rsvpStatus: (userMembership === null || userMembership === void 0 ? void 0 : userMembership.rsvpStatus) || 'PENDING',
        },
        memberships: ((_b = eventWithMembers.memberships) === null || _b === void 0 ? void 0 : _b.map((membership) => ({
            id: membership.id,
            role: membership.role,
            rsvpStatus: membership.rsvpStatus,
            person: {
                id: membership.person.id,
                firstName: membership.person.firstName,
                lastName: membership.person.lastName,
                username: membership.person.username,
                imageUrl: membership.person.imageUrl,
            },
        }))) || [],
    };
}
export function createEventPageDTO(eventWithPosts, currentUserId) {
    var _a;
    const baseEvent = createEventDetailsDTO(eventWithPosts, currentUserId);
    return Object.assign(Object.assign({}, baseEvent), { posts: ((_a = eventWithPosts.posts) === null || _a === void 0 ? void 0 : _a.map((post) => {
            var _a;
            return ({
                id: post.id,
                title: post.title,
                content: post.content,
                authorId: post.authorId,
                eventId: post.eventId,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                replies: ((_a = post.replies) === null || _a === void 0 ? void 0 : _a.map((reply) => ({
                    id: reply.id,
                    text: reply.text,
                    authorId: reply.authorId,
                    postId: reply.postId,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    author: {
                        id: reply.author.id,
                        firstName: reply.author.firstName,
                        lastName: reply.author.lastName,
                        username: reply.author.username,
                        imageUrl: reply.author.imageUrl,
                    },
                }))) || [],
                author: {
                    id: post.author.id,
                    firstName: post.author.firstName,
                    lastName: post.author.lastName,
                    username: post.author.username,
                    imageUrl: post.author.imageUrl,
                },
            });
        })) || [] });
}
// Minimal DTO for event posts hook
export const EventPostsDTO = z.object({
    posts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
        eventId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        replies: z.array(z.object({
            id: z.string(),
            text: z.string(),
            authorId: z.string(),
            postId: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
        })),
    })),
    userRole: z.string(),
    userId: z.string(),
    members: z.array(z.object({
        id: z.string(),
        role: z.string(),
        rsvpStatus: z.string(),
        personId: z.string(),
        eventId: z.string(),
    })),
    eventDateTime: z.date().nullable(),
});
// Minimal DTO for event members hook
export const EventMembersDTO = z.object({
    members: z.array(z.object({
        id: z.string(),
        role: z.string(),
        rsvpStatus: z.string(),
        personId: z.string(),
        eventId: z.string(),
    })),
    userRole: z.string(),
    userId: z.string(),
    eventDateTime: z.date().nullable(),
});
