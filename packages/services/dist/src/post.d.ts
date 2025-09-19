import { PostPageDTO, PostReplyFeedDTO } from '@groupi/schema';
export interface PostPageData {
    success?: {
        post: PostPageDTO;
        userId: string;
        userRole: string;
    };
    error?: string;
}
export interface PostReplyFeedData {
    success?: {
        post: PostReplyFeedDTO;
        userId: string;
        userRole: string;
    };
    error?: string;
}
export declare const fetchPostPageData: (postId: string) => Promise<PostPageData>;
export declare const fetchPostWithEventData: (postId: string) => Promise<PostReplyFeedData>;
export type PostData = PostPageData;
export declare const fetchPostData: (postId: string) => Promise<PostPageData>;
export declare function createPost({ title, content, eventId, }: {
    title: string;
    content: string;
    eventId: string;
}): Promise<{
    success: string;
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
export declare function updatePost({ id, title, content, }: {
    id: string;
    title: string;
    content: string;
}): Promise<{
    success: string;
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
export declare function deletePost({ id }: {
    id: string;
}): Promise<{
    success: {
        message: string;
        post: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            eventId: string;
            title: string;
            editedAt: Date;
            content: string;
        };
    };
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
