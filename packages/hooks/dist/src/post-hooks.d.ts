export {};
import { PostPageData, PostReplyFeedData } from '@groupi/services';
export declare function usePostPageQuery(postId: string, select: (data: PostPageData) => any): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function usePostReplyFeedQuery(postId: string, select: (data: PostReplyFeedData) => any): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function usePostPage(postId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function usePostReplyFeed(postId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function usePostRepliesAndMembers(postId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCreatePost(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    title: string;
    content: string;
    eventId: string;
}, unknown>;
export declare function useUpdatePost(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    title: string;
    content: string;
}, unknown>;
export declare function useDeletePost(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
}, unknown>;
export declare const usePostData: typeof usePostPage;
export declare const usePostWithEventData: typeof usePostReplyFeed;
export declare const usePostReplies: typeof usePostRepliesAndMembers;
