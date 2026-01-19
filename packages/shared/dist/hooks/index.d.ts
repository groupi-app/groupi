import * as convex_react from 'convex/react';

/**
 * Type abstractions for Convex integration
 * Allows the shared package to work with any Convex schema
 *
 * These are intentionally typed as 'any' because:
 * 1. The shared package must work with any Convex schema without knowing the exact types
 * 2. The consuming app (web/mobile) provides the actual typed API at runtime
 * 3. Using 'unknown' would require extensive casting throughout the codebase
 */
type ConvexApi = any;
type ConvexDataModel = any;
type ConvexId<T extends string> = string & {
    __tableName: T;
};
type Status = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

/**
 * Platform-agnostic authentication hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

/**
 * Auth hooks factory - accepts api and returns auth hooks
 */
declare function createAuthHooks(api: ConvexApi): {
    useCurrentUser: () => any;
    useAuthState: () => {
        isLoading: boolean;
        isAuthenticated: boolean;
        user: any;
        isReady: boolean;
        hasUser: boolean;
    };
    useUserProfile: (userId?: ConvexId<"users">) => any;
    useUserMembership: (eventId?: ConvexId<"events">) => any;
    useUserPermissions: (eventId?: ConvexId<"events">) => {
        role: any;
        isOrganizer: boolean;
        isModerator: boolean;
        isAttendee: boolean;
        canManageEvent: boolean;
        canDeleteEvent: boolean;
        isMember: boolean;
    };
    useAuthGuard: () => {
        isLoading: boolean;
        isAuthenticated: boolean;
        user: any;
        shouldRedirectToLogin: boolean;
        shouldRedirectToOnboarding: boolean;
        isAuthorized: any;
    };
    useEventAccessGuard: (eventId: ConvexId<"events">) => {
        membership: any;
        hasEventAccess: any;
        shouldRedirectToLogin: boolean;
        shouldShowNotAuthorized: any;
        isLoading: boolean;
        isAuthenticated: boolean;
        user: any;
        shouldRedirectToOnboarding: boolean;
        isAuthorized: any;
    };
    useLogin: () => (_credentials: {
        email: string;
        password: string;
    }) => Promise<never>;
    useSignup: () => (_data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => Promise<never>;
    useLogout: () => () => Promise<never>;
};

/**
 * Platform-agnostic event data hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

/**
 * Event data hooks factory - accepts api and returns event data hooks
 */
declare function createEventDataHooks(api: ConvexApi): {
    useEventHeader: (eventId: ConvexId<"events">) => any;
    useEventMembers: (eventId: ConvexId<"events">) => any;
    useUserEvents: () => any;
    useMutualEvents: (userId: ConvexId<"users">) => any;
    useEventAvailability: (eventId: ConvexId<"events">) => any;
    useCanManageEvent: (eventId: ConvexId<"events">) => {
        canManage: boolean;
        canDelete: boolean;
        canEdit: boolean;
        role: any;
    };
    useEventLoadingStates: (eventId: ConvexId<"events">) => {
        isLoadingHeader: boolean;
        isLoadingMembers: boolean;
        isLoadingAvailability: boolean;
        isLoadingAny: boolean;
        hasHeaderData: boolean;
        hasMembersData: boolean;
        hasAvailabilityData: boolean;
    };
};

/**
 * Event action hooks factory - accepts api and returns event action hooks
 */
declare function createEventActionHooks(api: ConvexApi): {
    useCreateEvent: () => convex_react.ReactMutation<any>;
    useUpdateEvent: () => convex_react.ReactMutation<any>;
    useDeleteEvent: () => convex_react.ReactMutation<any>;
    useLeaveEvent: () => convex_react.ReactMutation<any>;
    useJoinEvent: () => convex_react.ReactMutation<any>;
    useUpdateRSVP: () => convex_react.ReactMutation<any>;
    useResetEventDate: () => convex_react.ReactMutation<any>;
    useUpdatePotentialDateTimes: () => convex_react.ReactMutation<any>;
    useEventActions: (eventId: ConvexId<"events">) => {
        updateEvent: (data: {
            title?: string;
            description?: string;
            location?: string;
        }) => Promise<any>;
        deleteEvent: () => Promise<any>;
        leaveEvent: () => Promise<any>;
        updateRSVP: (rsvpStatus: Status) => Promise<any>;
        resetEventDate: () => Promise<any>;
        updatePotentialDateTimes: (potentialDateTimes: string[]) => Promise<any>;
    };
    useEventManagement: (eventId: ConvexId<"events">) => {
        updateEvent: (data: {
            title?: string;
            description?: string;
            location?: string;
        }) => Promise<any>;
        deleteEvent: () => Promise<any>;
        leaveEvent: () => Promise<any>;
        updateRSVP: (rsvpStatus: Status) => Promise<any>;
        resetEventDate: () => Promise<any>;
        updatePotentialDateTimes: (potentialDateTimes: string[]) => Promise<any>;
    };
};

/**
 * Platform-agnostic post data hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

/**
 * Post data hooks factory - accepts api and returns post data hooks
 */
declare function createPostDataHooks(api: ConvexApi): {
    usePostDetail: (postId: ConvexId<"posts">) => any;
    useEventPostFeed: (eventId: ConvexId<"events">) => any;
    usePostReplies: (postId: ConvexId<"posts">) => any;
    usePost: (postId: ConvexId<"posts">) => any;
    useCanManagePost: (postId: ConvexId<"posts">) => {
        canEdit: any;
        canDelete: any;
        isAuthor: any;
        role: any;
    };
    usePostLoadingStates: (postId: ConvexId<"posts">) => {
        isLoadingPost: boolean;
        isLoadingReplies: boolean;
        isLoadingAny: boolean;
        hasPostData: boolean;
        hasRepliesData: boolean;
    };
};

/**
 * Post action hooks factory - accepts api and returns post action hooks
 */
declare function createPostActionHooks(api: ConvexApi): {
    useCreatePost: () => convex_react.ReactMutation<any>;
    useUpdatePost: () => convex_react.ReactMutation<any>;
    useDeletePost: () => convex_react.ReactMutation<any>;
    useCreateReply: () => convex_react.ReactMutation<any>;
    useUpdateReply: () => convex_react.ReactMutation<any>;
    useDeleteReply: () => convex_react.ReactMutation<any>;
    usePostActions: (postId: ConvexId<"posts">) => {
        updatePost: (data: {
            title?: string;
            content?: string;
        }) => Promise<any>;
        deletePost: () => Promise<any>;
        createReply: (data: {
            content: string;
        }) => Promise<any>;
    };
    useReplyActions: (replyId: ConvexId<"replies">) => {
        updateReply: (data: {
            content: string;
        }) => Promise<any>;
        deleteReply: () => Promise<any>;
    };
    useEventPostActions: (eventId: ConvexId<"events">) => {
        createPost: (data: {
            title: string;
            content: string;
        }) => Promise<any>;
    };
    usePostManagement: (postId: ConvexId<"posts">) => {
        updatePost: (data: {
            title?: string;
            content?: string;
        }) => Promise<any>;
        deletePost: () => Promise<any>;
        createReply: (data: {
            content: string;
        }) => Promise<any>;
    };
};

/**
 * Combined event hooks factory - combines data and action hooks
 * Use this for convenience when you need both queries and mutations
 */
declare function createEventHooks(api: ConvexApi): {
    useCreateEvent: () => convex_react.ReactMutation<any>;
    useUpdateEvent: () => convex_react.ReactMutation<any>;
    useDeleteEvent: () => convex_react.ReactMutation<any>;
    useLeaveEvent: () => convex_react.ReactMutation<any>;
    useJoinEvent: () => convex_react.ReactMutation<any>;
    useUpdateRSVP: () => convex_react.ReactMutation<any>;
    useResetEventDate: () => convex_react.ReactMutation<any>;
    useUpdatePotentialDateTimes: () => convex_react.ReactMutation<any>;
    useEventActions: (eventId: ConvexId<"events">) => {
        updateEvent: (data: {
            title?: string;
            description?: string;
            location?: string;
        }) => Promise<any>;
        deleteEvent: () => Promise<any>;
        leaveEvent: () => Promise<any>;
        updateRSVP: (rsvpStatus: Status) => Promise<any>;
        resetEventDate: () => Promise<any>;
        updatePotentialDateTimes: (potentialDateTimes: string[]) => Promise<any>;
    };
    useEventManagement: (eventId: ConvexId<"events">) => {
        updateEvent: (data: {
            title?: string;
            description?: string;
            location?: string;
        }) => Promise<any>;
        deleteEvent: () => Promise<any>;
        leaveEvent: () => Promise<any>;
        updateRSVP: (rsvpStatus: Status) => Promise<any>;
        resetEventDate: () => Promise<any>;
        updatePotentialDateTimes: (potentialDateTimes: string[]) => Promise<any>;
    };
    useEventHeader: (eventId: ConvexId<"events">) => any;
    useEventMembers: (eventId: ConvexId<"events">) => any;
    useUserEvents: () => any;
    useMutualEvents: (userId: ConvexId<"users">) => any;
    useEventAvailability: (eventId: ConvexId<"events">) => any;
    useCanManageEvent: (eventId: ConvexId<"events">) => {
        canManage: boolean;
        canDelete: boolean;
        canEdit: boolean;
        role: any;
    };
    useEventLoadingStates: (eventId: ConvexId<"events">) => {
        isLoadingHeader: boolean;
        isLoadingMembers: boolean;
        isLoadingAvailability: boolean;
        isLoadingAny: boolean;
        hasHeaderData: boolean;
        hasMembersData: boolean;
        hasAvailabilityData: boolean;
    };
};

export { type ConvexApi, type ConvexDataModel, type ConvexId, createAuthHooks, createEventActionHooks, createEventDataHooks, createEventHooks, createPostActionHooks, createPostDataHooks };
