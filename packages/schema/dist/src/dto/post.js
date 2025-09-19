import { z } from 'zod';
import { RoleSchema, PostSchema, ReplySchema } from '../generated';
import { AuthorDTO } from './person';
// Post DTO for cards and feeds
export const PostCardDTO = PostSchema.pick({
    id: true,
    title: true,
    content: true,
    createdAt: true,
    editedAt: true,
    authorId: true,
    eventId: true,
}).extend({
    author: AuthorDTO,
    replyCount: z.number(),
});
// Post DTO for post page display (includes replies)
export const PostPageDTO = PostCardDTO.extend({
    replies: z.array(ReplySchema.pick({
        id: true,
        text: true,
        createdAt: true,
    }).extend({
        author: AuthorDTO,
    })),
});
// Post DTO for reply feed functionality (includes event context for permissions)
export const PostReplyFeedDTO = PostPageDTO.extend({
    event: z.object({
        id: z.string(),
        title: z.string(),
        chosenDateTime: z.date().nullable(),
        memberships: z.array(z.object({
            id: z.string(),
            role: RoleSchema,
            rsvpStatus: RoleSchema,
            personId: z.string(),
            eventId: z.string(),
        })),
    }),
});
// Factory functions to create DTOs from Prisma data
export function createPostCardDTO(post) {
    return {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        editedAt: post.editedAt,
        authorId: post.authorId,
        eventId: post.eventId,
        author: {
            id: post.author.id,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            username: post.author.username,
            imageUrl: post.author.imageUrl,
        },
        replyCount: post.replies.length,
    };
}
export function createPostPageDTO(postWithReplies) {
    return {
        id: postWithReplies.id,
        title: postWithReplies.title,
        content: postWithReplies.content,
        createdAt: postWithReplies.createdAt,
        editedAt: postWithReplies.editedAt,
        authorId: postWithReplies.authorId,
        eventId: postWithReplies.eventId,
        author: {
            id: postWithReplies.author.id,
            firstName: postWithReplies.author.firstName,
            lastName: postWithReplies.author.lastName,
            username: postWithReplies.author.username,
            imageUrl: postWithReplies.author.imageUrl,
        },
        replyCount: postWithReplies.replies.length,
        replies: postWithReplies.replies.map(reply => ({
            id: reply.id,
            text: reply.text,
            createdAt: reply.createdAt,
            author: {
                id: reply.author.id,
                firstName: reply.author.firstName,
                lastName: reply.author.lastName,
                username: reply.author.username,
                imageUrl: reply.author.imageUrl,
            },
        })),
    };
}
export function createPostReplyFeedDTO(postWithEvent) {
    const basePost = createPostPageDTO(postWithEvent);
    return Object.assign(Object.assign({}, basePost), { event: {
            id: postWithEvent.event.id,
            title: postWithEvent.event.title,
            chosenDateTime: postWithEvent.event.chosenDateTime,
            memberships: postWithEvent.event.memberships.map(membership => ({
                id: membership.id,
                role: membership.role,
                rsvpStatus: membership.rsvpStatus,
                personId: membership.personId,
                eventId: membership.eventId,
            })),
        } });
}
// Backward compatibility aliases
export const PostWithRepliesDTO = PostPageDTO;
export const PostWithEventDTO = PostReplyFeedDTO;
export const createPostWithRepliesDTO = createPostPageDTO;
export const createPostWithEventDTO = createPostReplyFeedDTO;
