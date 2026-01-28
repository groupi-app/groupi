'use strict';

var react = require('convex/react');
var react$1 = require('react');

// src/hooks/useAuth.ts
function createAuthHooks(api) {
  function useCurrentUser() {
    const { isAuthenticated } = react.useConvexAuth();
    return react.useQuery(
      api.users.queries.getCurrentUser,
      isAuthenticated ? {} : "skip"
    );
  }
  function useAuthState() {
    const { isLoading, isAuthenticated } = react.useConvexAuth();
    const user = useCurrentUser();
    return {
      isLoading,
      isAuthenticated,
      user,
      isReady: !isLoading && isAuthenticated && user !== void 0,
      hasUser: user !== null && user !== void 0
    };
  }
  function useUserProfile(userId) {
    return react.useQuery(
      api.users.queries.getUserProfile,
      userId ? { userId } : "skip"
    );
  }
  function useUserMembership(eventId) {
    const user = useCurrentUser();
    return react.useQuery(
      api.memberships.queries.getUserMembership,
      user && eventId ? { eventId } : "skip"
    );
  }
  function useUserPermissions(eventId) {
    const membership = useUserMembership(eventId);
    const role = membership?.role;
    return {
      role,
      isOrganizer: role === "ORGANIZER",
      isModerator: role === "MODERATOR",
      isAttendee: role === "ATTENDEE",
      canManageEvent: role === "ORGANIZER" || role === "MODERATOR",
      canDeleteEvent: role === "ORGANIZER",
      isMember: membership !== null && membership !== void 0
    };
  }
  function useAuthGuard() {
    const { isLoading, isAuthenticated, user } = useAuthState();
    return {
      isLoading,
      isAuthenticated,
      user,
      shouldRedirectToLogin: !isLoading && !isAuthenticated,
      shouldRedirectToOnboarding: !isLoading && isAuthenticated && !user,
      isAuthorized: !isLoading && isAuthenticated && user
    };
  }
  function useEventAccessGuard(eventId) {
    const authGuard = useAuthGuard();
    const membership = useUserMembership(eventId);
    return {
      ...authGuard,
      membership,
      hasEventAccess: authGuard.isAuthorized && membership !== null,
      shouldRedirectToLogin: authGuard.shouldRedirectToLogin,
      shouldShowNotAuthorized: authGuard.isAuthorized && membership === null
    };
  }
  function useLogin() {
    return async (_credentials) => {
      throw new Error(
        "useLogin must be implemented by the platform-specific auth adapter"
      );
    };
  }
  function useSignup() {
    return async (_data) => {
      throw new Error(
        "useSignup must be implemented by the platform-specific auth adapter"
      );
    };
  }
  function useLogout() {
    return async () => {
      throw new Error(
        "useLogout must be implemented by the platform-specific auth adapter"
      );
    };
  }
  return {
    useCurrentUser,
    useAuthState,
    useUserProfile,
    useUserMembership,
    useUserPermissions,
    useAuthGuard,
    useEventAccessGuard,
    useLogin,
    useSignup,
    useLogout
  };
}
function createEventDataHooks(api) {
  function useEventHeader(eventId) {
    return react.useQuery(api.events.queries.getEventHeader, { eventId });
  }
  function useEventMembers(eventId) {
    return react.useQuery(api.events.queries.getEventAttendeesData, { eventId });
  }
  function useUserEvents() {
    return react.useQuery(api.events.queries.getUserEvents, {});
  }
  function useMutualEvents(userId) {
    return react.useQuery(api.events.queries.getMutualEvents, { userId });
  }
  function useEventAvailability(eventId) {
    return react.useQuery(api.events.queries.getEventAvailabilityData, { eventId });
  }
  function useCanManageEvent(eventId) {
    const eventData = useEventHeader(eventId);
    const userMembership = eventData?.userMembership;
    return {
      canManage: userMembership?.role === "ORGANIZER" || userMembership?.role === "MODERATOR",
      canDelete: userMembership?.role === "ORGANIZER",
      canEdit: userMembership?.role === "ORGANIZER" || userMembership?.role === "MODERATOR",
      role: userMembership?.role
    };
  }
  function useEventLoadingStates(eventId) {
    const eventHeader = useEventHeader(eventId);
    const eventMembers = useEventMembers(eventId);
    const eventAvailability = useEventAvailability(eventId);
    return {
      isLoadingHeader: eventHeader === void 0,
      isLoadingMembers: eventMembers === void 0,
      isLoadingAvailability: eventAvailability === void 0,
      isLoadingAny: eventHeader === void 0 || eventMembers === void 0,
      hasHeaderData: eventHeader !== void 0,
      hasMembersData: eventMembers !== void 0,
      hasAvailabilityData: eventAvailability !== void 0
    };
  }
  return {
    useEventHeader,
    useEventMembers,
    useUserEvents,
    useMutualEvents,
    useEventAvailability,
    useCanManageEvent,
    useEventLoadingStates
  };
}
function createEventActionHooks(api) {
  function useCreateEvent() {
    return react.useMutation(api.events.mutations.createEvent);
  }
  function useUpdateEvent() {
    return react.useMutation(api.events.mutations.updateEvent);
  }
  function useDeleteEvent() {
    return react.useMutation(api.events.mutations.deleteEvent);
  }
  function useLeaveEvent() {
    return react.useMutation(api.events.mutations.leaveEvent);
  }
  function useJoinEvent() {
    return react.useMutation(api.events.mutations.joinEvent);
  }
  function useUpdateRSVP() {
    return react.useMutation(api.events.mutations.updateRSVP);
  }
  function useResetEventDate() {
    return react.useMutation(api.events.mutations.resetEventDate);
  }
  function useUpdatePotentialDateTimes() {
    return react.useMutation(api.events.mutations.updatePotentialDateTimes);
  }
  function useEventActions(eventId) {
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const leaveEvent = useLeaveEvent();
    const updateRSVP = useUpdateRSVP();
    const resetEventDate = useResetEventDate();
    const updatePotentialDateTimes = useUpdatePotentialDateTimes();
    const updateEventForId = react$1.useCallback(
      async (data) => {
        return updateEvent({ eventId, ...data });
      },
      [eventId, updateEvent]
    );
    const deleteEventForId = react$1.useCallback(async () => {
      return deleteEvent({ eventId });
    }, [eventId, deleteEvent]);
    const leaveEventForId = react$1.useCallback(async () => {
      return leaveEvent({ eventId });
    }, [eventId, leaveEvent]);
    const updateRSVPForId = react$1.useCallback(
      async (rsvpStatus) => {
        return updateRSVP({ eventId, rsvpStatus });
      },
      [eventId, updateRSVP]
    );
    const resetDateForId = react$1.useCallback(async () => {
      return resetEventDate({ eventId });
    }, [eventId, resetEventDate]);
    const updateDateOptionsForId = react$1.useCallback(
      async (potentialDateTimes) => {
        return updatePotentialDateTimes({ eventId, potentialDateTimes });
      },
      [eventId, updatePotentialDateTimes]
    );
    return {
      updateEvent: updateEventForId,
      deleteEvent: deleteEventForId,
      leaveEvent: leaveEventForId,
      updateRSVP: updateRSVPForId,
      resetEventDate: resetDateForId,
      updatePotentialDateTimes: updateDateOptionsForId
    };
  }
  function useEventManagement(eventId) {
    const actions = useEventActions(eventId);
    return {
      // Actions (no UI feedback - handle in platform layer)
      ...actions
    };
  }
  return {
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useLeaveEvent,
    useJoinEvent,
    useUpdateRSVP,
    useResetEventDate,
    useUpdatePotentialDateTimes,
    useEventActions,
    useEventManagement
  };
}
function createPostDataHooks(api) {
  function usePostDetail(postId) {
    return react.useQuery(api.posts.queries.getPostDetail, { postId });
  }
  function useEventPostFeed(eventId) {
    return react.useQuery(api.posts.queries.getEventPostFeed, { eventId });
  }
  function usePostReplies(postId) {
    return react.useQuery(api.posts.queries.getPostReplies, { postId });
  }
  function usePost(postId) {
    return react.useQuery(api.posts.queries.getPost, { postId });
  }
  function useCanManagePost(postId) {
    const postData = usePostDetail(postId);
    return {
      canEdit: postData?.post && postData?.userMembership && (postData.post.authorId === postData.userMembership.person._id || postData.userMembership.role === "ORGANIZER" || postData.userMembership.role === "MODERATOR"),
      canDelete: postData?.post && postData?.userMembership && (postData.post.authorId === postData.userMembership.person._id || postData.userMembership.role === "ORGANIZER" || postData.userMembership.role === "MODERATOR"),
      isAuthor: postData?.post && postData?.userMembership && postData.post.authorId === postData.userMembership.person._id,
      role: postData?.userMembership?.role
    };
  }
  function usePostLoadingStates(postId) {
    const postDetail = usePostDetail(postId);
    const postReplies = usePostReplies(postId);
    return {
      isLoadingPost: postDetail === void 0,
      isLoadingReplies: postReplies === void 0,
      isLoadingAny: postDetail === void 0 || postReplies === void 0,
      hasPostData: postDetail !== void 0,
      hasRepliesData: postReplies !== void 0
    };
  }
  return {
    usePostDetail,
    useEventPostFeed,
    usePostReplies,
    usePost,
    useCanManagePost,
    usePostLoadingStates
  };
}
function createPostActionHooks(api) {
  function useCreatePost() {
    return react.useMutation(api.posts.mutations.createPost);
  }
  function useUpdatePost() {
    return react.useMutation(api.posts.mutations.updatePost);
  }
  function useDeletePost() {
    return react.useMutation(api.posts.mutations.deletePost);
  }
  function useCreateReply() {
    return react.useMutation(api.posts.mutations.createReply);
  }
  function useUpdateReply() {
    return react.useMutation(api.posts.mutations.updateReply);
  }
  function useDeleteReply() {
    return react.useMutation(api.posts.mutations.deleteReply);
  }
  function usePostActions(postId) {
    const updatePost = useUpdatePost();
    const deletePost = useDeletePost();
    const createReply = useCreateReply();
    const updatePostForId = react$1.useCallback(
      async (data) => {
        return updatePost({ postId, ...data });
      },
      [postId, updatePost]
    );
    const deletePostForId = react$1.useCallback(async () => {
      return deletePost({ postId });
    }, [postId, deletePost]);
    const createReplyForId = react$1.useCallback(
      async (data) => {
        return createReply({ postId, ...data });
      },
      [postId, createReply]
    );
    return {
      updatePost: updatePostForId,
      deletePost: deletePostForId,
      createReply: createReplyForId
    };
  }
  function useReplyActions(replyId) {
    const updateReply = useUpdateReply();
    const deleteReply = useDeleteReply();
    const updateReplyForId = react$1.useCallback(
      async (data) => {
        return updateReply({ replyId, ...data });
      },
      [replyId, updateReply]
    );
    const deleteReplyForId = react$1.useCallback(async () => {
      return deleteReply({ replyId });
    }, [replyId, deleteReply]);
    return {
      updateReply: updateReplyForId,
      deleteReply: deleteReplyForId
    };
  }
  function useEventPostActions(eventId) {
    const createPost = useCreatePost();
    const createEventPost = react$1.useCallback(
      async (data) => {
        return createPost({ eventId, ...data });
      },
      [eventId, createPost]
    );
    return {
      createPost: createEventPost
    };
  }
  function usePostManagement(postId) {
    const actions = usePostActions(postId);
    return {
      // Actions (no UI feedback - handle in platform layer)
      ...actions
    };
  }
  return {
    useCreatePost,
    useUpdatePost,
    useDeletePost,
    useCreateReply,
    useUpdateReply,
    useDeleteReply,
    usePostActions,
    useReplyActions,
    useEventPostActions,
    usePostManagement
  };
}

// src/hooks/index.ts
function createEventHooks(api) {
  const dataHooks = createEventDataHooks(api);
  const actionHooks = createEventActionHooks(api);
  return {
    ...dataHooks,
    ...actionHooks
  };
}

exports.createAuthHooks = createAuthHooks;
exports.createEventActionHooks = createEventActionHooks;
exports.createEventDataHooks = createEventDataHooks;
exports.createEventHooks = createEventHooks;
exports.createPostActionHooks = createPostActionHooks;
exports.createPostDataHooks = createPostDataHooks;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map