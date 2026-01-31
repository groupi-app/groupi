import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// src/hooks/useAuth.ts
function createAuthHooks(api) {
  function useCurrentUser() {
    const { isAuthenticated } = useConvexAuth();
    return useQuery(
      api.users.queries.getCurrentUser,
      isAuthenticated ? {} : "skip"
    );
  }
  function useAuthState() {
    const { isLoading, isAuthenticated } = useConvexAuth();
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
    return useQuery(
      api.users.queries.getUserProfile,
      userId ? { userId } : "skip"
    );
  }
  function useUserMembership(eventId) {
    const user = useCurrentUser();
    return useQuery(
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
    return useQuery(api.events.queries.getEventHeader, { eventId });
  }
  function useEventMembers(eventId) {
    return useQuery(api.events.queries.getEventAttendeesData, { eventId });
  }
  function useUserEvents() {
    return useQuery(api.events.queries.getUserEvents, {});
  }
  function useMutualEvents(userId) {
    return useQuery(api.events.queries.getMutualEvents, { userId });
  }
  function useEventAvailability(eventId) {
    return useQuery(api.events.queries.getEventAvailabilityData, { eventId });
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
    return useMutation(api.events.mutations.createEvent);
  }
  function useUpdateEvent() {
    return useMutation(api.events.mutations.updateEvent);
  }
  function useDeleteEvent() {
    return useMutation(api.events.mutations.deleteEvent);
  }
  function useLeaveEvent() {
    return useMutation(api.events.mutations.leaveEvent);
  }
  function useJoinEvent() {
    return useMutation(api.events.mutations.joinEvent);
  }
  function useUpdateRSVP() {
    return useMutation(api.events.mutations.updateRSVP);
  }
  function useResetEventDate() {
    return useMutation(api.events.mutations.resetEventDate);
  }
  function useUpdatePotentialDateTimes() {
    return useMutation(api.events.mutations.updatePotentialDateTimes);
  }
  function useEventActions(eventId) {
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const leaveEvent = useLeaveEvent();
    const updateRSVP = useUpdateRSVP();
    const resetEventDate = useResetEventDate();
    const updatePotentialDateTimes = useUpdatePotentialDateTimes();
    const updateEventForId = useCallback(
      async (data) => {
        return updateEvent({ eventId, ...data });
      },
      [eventId, updateEvent]
    );
    const deleteEventForId = useCallback(async () => {
      return deleteEvent({ eventId });
    }, [eventId, deleteEvent]);
    const leaveEventForId = useCallback(async () => {
      return leaveEvent({ eventId });
    }, [eventId, leaveEvent]);
    const updateRSVPForId = useCallback(
      async (rsvpStatus) => {
        return updateRSVP({ eventId, rsvpStatus });
      },
      [eventId, updateRSVP]
    );
    const resetDateForId = useCallback(async () => {
      return resetEventDate({ eventId });
    }, [eventId, resetEventDate]);
    const updateDateOptionsForId = useCallback(
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
    return useQuery(api.posts.queries.getPostDetail, { postId });
  }
  function useEventPostFeed(eventId) {
    return useQuery(api.posts.queries.getEventPostFeed, { eventId });
  }
  function usePostReplies(postId) {
    return useQuery(api.posts.queries.getPostReplies, { postId });
  }
  function usePost(postId) {
    return useQuery(api.posts.queries.getPost, { postId });
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
    return useMutation(api.posts.mutations.createPost);
  }
  function useUpdatePost() {
    return useMutation(api.posts.mutations.updatePost);
  }
  function useDeletePost() {
    return useMutation(api.posts.mutations.deletePost);
  }
  function useCreateReply() {
    return useMutation(api.posts.mutations.createReply);
  }
  function useUpdateReply() {
    return useMutation(api.posts.mutations.updateReply);
  }
  function useDeleteReply() {
    return useMutation(api.posts.mutations.deleteReply);
  }
  function usePostActions(postId) {
    const updatePost = useUpdatePost();
    const deletePost = useDeletePost();
    const createReply = useCreateReply();
    const updatePostForId = useCallback(
      async (data) => {
        return updatePost({ postId, ...data });
      },
      [postId, updatePost]
    );
    const deletePostForId = useCallback(async () => {
      return deletePost({ postId });
    }, [postId, deletePost]);
    const createReplyForId = useCallback(
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
    const updateReplyForId = useCallback(
      async (data) => {
        return updateReply({ replyId, ...data });
      },
      [replyId, updateReply]
    );
    const deleteReplyForId = useCallback(async () => {
      return deleteReply({ replyId });
    }, [replyId, deleteReply]);
    return {
      updateReply: updateReplyForId,
      deleteReply: deleteReplyForId
    };
  }
  function useEventPostActions(eventId) {
    const createPost = useCreatePost();
    const createEventPost = useCallback(
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

// src/utils/device.ts
var deviceInfo = null;
function setDeviceInfo(info) {
  deviceInfo = info;
}
function getDeviceInfo() {
  if (!deviceInfo) {
    const isWeb2 = typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined";
    return {
      platform: isWeb2 ? "web" : "ios",
      // Default to ios for mobile fallback
      isWeb: isWeb2,
      isMobile: !isWeb2
    };
  }
  return deviceInfo;
}
var currentLayout = null;
function setLayoutInfo(layout) {
  currentLayout = layout;
}
function getLayoutInfo() {
  return currentLayout;
}
function isLandscape() {
  const layout = getLayoutInfo();
  if (!layout) return false;
  return layout.screen.width > layout.screen.height;
}
function isPortrait() {
  return !isLandscape();
}
function isSmallScreen() {
  const layout = getLayoutInfo();
  if (!layout) return false;
  return layout.screen.width < 768;
}
function isLargeScreen() {
  const layout = getLayoutInfo();
  if (!layout) return false;
  return layout.screen.width > 1024;
}
var safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
function setSafeAreaInsets(insets) {
  safeAreaInsets = insets;
}
function getSafeAreaInsets() {
  return safeAreaInsets;
}
function getResponsiveSize(baseSize, screenWidth) {
  const layout = getLayoutInfo();
  const width = screenWidth || layout?.screen.width || 375;
  const scale = width / 375;
  return Math.round(baseSize * scale);
}
function getResponsiveFontSize(baseFontSize) {
  return getResponsiveSize(baseFontSize);
}
function getResponsiveSpacing(baseSpacing) {
  return getResponsiveSize(baseSpacing);
}

// src/utils/keyboard.ts
var keyboardState = { isVisible: false, height: 0 };
var keyboardListeners = [];
function setKeyboardState(state) {
  keyboardState = state;
  keyboardListeners.forEach((listener) => listener(state));
}
function getKeyboardState() {
  return keyboardState;
}
function subscribeToKeyboard(callback) {
  keyboardListeners.push(callback);
  return () => {
    keyboardListeners = keyboardListeners.filter(
      (listener) => listener !== callback
    );
  };
}
function isKeyboardVisible() {
  return keyboardState.isVisible;
}
function getKeyboardHeight() {
  return keyboardState.height;
}
var keyboardOptions = {};
function setKeyboardOptions(options) {
  keyboardOptions = { ...keyboardOptions, ...options };
}
function getKeyboardOptions() {
  return keyboardOptions;
}
var dismissKeyboardFn = null;
function setDismissKeyboardFunction(fn) {
  dismissKeyboardFn = fn;
}
function dismissKeyboard() {
  if (dismissKeyboardFn) {
    dismissKeyboardFn();
  }
}
function calculateKeyboardAvoidingOffset(inputY, inputHeight, screenHeight, additionalPadding = 20) {
  if (!keyboardState.isVisible) return 0;
  const keyboardTop = screenHeight - keyboardState.height;
  const inputBottom = inputY + inputHeight;
  const requiredOffset = inputBottom - keyboardTop + additionalPadding;
  return Math.max(0, requiredOffset);
}
function wouldBeHiddenByKeyboard(inputY, inputHeight, screenHeight) {
  if (!keyboardState.isVisible) return false;
  const keyboardTop = screenHeight - keyboardState.height;
  const inputBottom = inputY + inputHeight;
  return inputBottom > keyboardTop;
}
var keyboardEventListeners = [];
function subscribeToKeyboardEvents(listener) {
  keyboardEventListeners.push(listener);
  return () => {
    keyboardEventListeners = keyboardEventListeners.filter((l) => l !== listener);
  };
}
function triggerKeyboardEvent(event) {
  keyboardEventListeners.forEach((listener) => listener(event));
}

// src/utils/accessibility.ts
function createButtonA11yProps(label, options) {
  return {
    accessibilityRole: "button",
    accessibilityLabel: label,
    accessibilityHint: options?.hint,
    accessibilityState: {
      disabled: options?.disabled,
      selected: options?.selected
    },
    accessible: true,
    testID: options?.testID
  };
}
function createTextInputA11yProps(label, options) {
  const hint = options?.required ? `${options.hint || ""} Required field.`.trim() : options?.hint;
  return {
    accessibilityRole: "none",
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: false
    },
    accessible: true,
    testID: options?.testID
  };
}
function createHeadingA11yProps(text, level) {
  return {
    accessibilityRole: "header",
    accessibilityLabel: level ? `Heading level ${level}: ${text}` : text,
    accessible: true
  };
}
function createListA11yProps(itemCount, label) {
  const accessibilityLabel = label ? `${label}, ${itemCount} items` : `List with ${itemCount} items`;
  return {
    accessibilityRole: "list",
    accessibilityLabel,
    accessible: true
  };
}
function createListItemA11yProps(label, index, total) {
  const positionInfo = index !== void 0 && total !== void 0 ? ` ${index + 1} of ${total}` : "";
  return {
    accessibilityRole: "listitem",
    accessibilityLabel: `${label}${positionInfo}`,
    accessible: true
  };
}
function createImageA11yProps(alt, decorative = false) {
  if (decorative) {
    return {
      accessible: false,
      accessibilityRole: "image"
    };
  }
  return {
    accessibilityRole: "image",
    accessibilityLabel: alt,
    accessible: true
  };
}
function createStatusA11yProps(message, type = "info") {
  return {
    accessibilityRole: "alert",
    accessibilityLabel: `${type}: ${message}`,
    accessible: true
  };
}
function createDialogA11yProps(title, description) {
  return {
    accessibilityRole: "none",
    accessibilityLabel: title,
    accessibilityHint: description,
    accessible: true
  };
}
function createTabA11yProps(label, selected, index, total) {
  return {
    accessibilityRole: "tab",
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected },
    accessible: true
  };
}
function createFormA11yProps(title, description) {
  return {
    accessibilityRole: "none",
    accessibilityLabel: title,
    accessibilityHint: description,
    accessible: true
  };
}
var focusManager = null;
function setFocusManager(manager) {
  focusManager = manager;
}
function getFocusManager() {
  return focusManager;
}
var screenReaderManager = null;
function setScreenReaderManager(manager) {
  screenReaderManager = manager;
}
function announceToScreenReader(message, type = "polite") {
  if (screenReaderManager) {
    screenReaderManager.announce(message, type);
  }
}
function isScreenReaderEnabled() {
  return screenReaderManager?.isScreenReaderEnabled() || false;
}
function calculateContrastRatio(_color1, _color2) {
  return 4.5;
}
function meetsContrastRequirement(foreground, background, level = "AA") {
  const ratio = calculateContrastRatio();
  return level === "AA" ? ratio >= 4.5 : ratio >= 7;
}
function getScaledFontSize(baseFontSize, textScale = 1) {
  return Math.round(baseFontSize * textScale);
}
function isLargeTextScale(textScale) {
  return textScale >= 1.3;
}

// src/utils/index.ts
function formatDate(date) {
  if (date === null || date === void 0) return "Invalid Date";
  const d = typeof date === "number" ? new Date(date) : date;
  if (!isValidDate(d)) return "Invalid Date";
  return d.toLocaleDateString(void 0, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatTime(date) {
  if (date === null || date === void 0) return "Invalid Date";
  const d = typeof date === "number" ? new Date(date) : date;
  if (!isValidDate(d)) return "Invalid Date";
  return d.toLocaleTimeString(void 0, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}
function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`;
}
function isSameDay(date1, date2) {
  const d1 = typeof date1 === "number" ? new Date(date1) : date1;
  const d2 = typeof date2 === "number" ? new Date(date2) : date2;
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
function formatDateTimeRange(startDate, endDate) {
  if (startDate === null || startDate === void 0) return "Invalid Date";
  const start = typeof startDate === "number" ? new Date(startDate) : startDate;
  if (!isValidDate(start)) return "Invalid Date";
  if (endDate === null || endDate === void 0) {
    return start.toLocaleString(void 0, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  const end = typeof endDate === "number" ? new Date(endDate) : endDate;
  if (!isValidDate(end)) {
    return start.toLocaleString(void 0, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  if (isSameDay(start, end)) {
    const dateStr = start.toLocaleDateString(void 0, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const startTime = start.toLocaleTimeString(void 0, {
      hour: "numeric",
      minute: "2-digit"
    });
    const endTime = end.toLocaleTimeString(void 0, {
      hour: "numeric",
      minute: "2-digit"
    });
    return `${dateStr}, ${startTime} - ${endTime}`;
  } else {
    const startStr = start.toLocaleString(void 0, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    const endStr = end.toLocaleString(void 0, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    return `${startStr} - ${endStr}`;
  }
}
function formatDateTimeRangeShort(startDate, endDate) {
  if (startDate === null || startDate === void 0) return "Invalid Date";
  const start = typeof startDate === "number" ? new Date(startDate) : startDate;
  if (!isValidDate(start)) return "Invalid Date";
  if (endDate === null || endDate === void 0) {
    return start.toLocaleString(void 0, {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
  }
  const end = typeof endDate === "number" ? new Date(endDate) : endDate;
  if (!isValidDate(end)) {
    return start.toLocaleString(void 0, {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
  }
  if (isSameDay(start, end)) {
    const dateStr = start.toLocaleDateString(void 0, {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
    const startTime = start.toLocaleTimeString(void 0, {
      hour: "numeric",
      minute: "2-digit"
    });
    const endTime = end.toLocaleTimeString(void 0, {
      hour: "numeric",
      minute: "2-digit"
    });
    return `${dateStr}, ${startTime} - ${endTime}`;
  } else {
    const startStr = start.toLocaleString(void 0, {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
    const endStr = end.toLocaleString(void 0, {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
    return `${startStr} - ${endStr}`;
  }
}
function isEventPast(startDateTime, endDateTime) {
  if (startDateTime === null || startDateTime === void 0) {
    return false;
  }
  const now = Date.now();
  if (endDateTime !== null && endDateTime !== void 0) {
    return endDateTime < now;
  }
  const startDate = new Date(startDateTime);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return startDate.getTime() < today.getTime();
}
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}
function truncateText(text, maxLength, suffix = "...") {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}
function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
function generateInitials(firstName, lastName) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
function sanitizeInput(input) {
  return input.trim().replace(/\s+/g, " ");
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validateRequired(value) {
  return value.trim().length > 0;
}
function validateMinLength(value, minLength) {
  return value.trim().length >= minLength;
}
function validateMaxLength(value, maxLength) {
  return value.trim().length <= maxLength;
}
function createValidator(rules) {
  return (value) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };
}
function createFormField(value = "") {
  return {
    value,
    error: void 0,
    touched: false
  };
}
function validateForm(fields, validators) {
  const errors = {};
  let isValid = true;
  for (const [fieldName, field] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const error = validator(field.value);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    }
  }
  return { isValid, errors };
}
function groupBy(array, keyFn) {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {}
  );
}
function uniqueBy(array, keyFn) {
  const seen = /* @__PURE__ */ new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function sortBy(array, keyFn) {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
}
function createAsyncState(data) {
  return {
    data,
    loading: false,
    error: void 0
  };
}
function setLoading(state) {
  return {
    ...state,
    loading: true,
    error: void 0
  };
}
function setSuccess(_state, data) {
  return {
    data,
    loading: false,
    error: void 0
  };
}
function setError(state, error) {
  return {
    ...state,
    loading: false,
    error
  };
}
function debounce(func, wait) {
  let timeoutId;
  let lastArgs;
  const debounced = (...args) => {
    lastArgs = args;
    if (timeoutId !== void 0) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    if (timeoutId !== void 0) {
      clearTimeout(timeoutId);
    }
    lastArgs = void 0;
  };
  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      lastArgs = void 0;
    }
  };
  return debounced;
}
async function retry(fn, maxAttempts = 3, delay = 1e3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  throw lastError;
}
function getPlatform() {
  if (typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined") {
    return "web";
  }
  return "mobile";
}
function isWeb() {
  return getPlatform() === "web";
}
function isMobile() {
  return getPlatform() === "mobile";
}
function serializeError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}
function createErrorMessage(operation, error) {
  const message = serializeError(error);
  return `Failed ${operation}: ${message}`;
}

// src/platform/navigation.ts
var navigationAdapter = null;
function setNavigationAdapter(adapter) {
  navigationAdapter = adapter;
}
function getNavigationAdapter() {
  if (!navigationAdapter) {
    throw new Error(
      "Navigation adapter not set. Call setNavigationAdapter() first."
    );
  }
  return navigationAdapter;
}
var navigation = {
  /**
   * Navigate to a new screen/page
   */
  push(path) {
    getNavigationAdapter().push(path);
  },
  /**
   * Replace current screen/page
   */
  replace(path) {
    getNavigationAdapter().replace(path);
  },
  /**
   * Go back to previous screen/page
   */
  back() {
    getNavigationAdapter().back();
  },
  /**
   * Check if navigation can go back
   */
  canGoBack() {
    return getNavigationAdapter().canGoBack();
  }
};
function useNavigation() {
  return navigation;
}

// src/platform/storage.ts
var storageAdapter = null;
function setStorageAdapter(adapter) {
  storageAdapter = adapter;
}
function getStorageAdapter() {
  if (!storageAdapter) {
    throw new Error("Storage adapter not set. Call setStorageAdapter() first.");
  }
  return storageAdapter;
}
var storage = {
  /**
   * Get item from storage
   */
  async getItem(key) {
    return getStorageAdapter().getItem(key);
  },
  /**
   * Set item in storage
   */
  async setItem(key, value) {
    return getStorageAdapter().setItem(key, value);
  },
  /**
   * Remove item from storage
   */
  async removeItem(key) {
    return getStorageAdapter().removeItem(key);
  },
  /**
   * Clear all items from storage
   */
  async clear() {
    return getStorageAdapter().clear();
  },
  /**
   * Get JSON item from storage
   */
  async getJSON(key) {
    const item = await getStorageAdapter().getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  },
  /**
   * Set JSON item in storage
   */
  async setJSON(key, value) {
    return getStorageAdapter().setItem(key, JSON.stringify(value));
  }
};
function useStorage() {
  return storage;
}

// src/platform/toast.ts
var toastAdapter = null;
function setToastAdapter(adapter) {
  toastAdapter = adapter;
}
function getToastAdapter() {
  if (!toastAdapter) {
    throw new Error("Toast adapter not set. Call setToastAdapter() first.");
  }
  return toastAdapter;
}
var toast = {
  /**
   * Show a toast with full options
   */
  show(options) {
    getToastAdapter().show(options);
  },
  /**
   * Show a success toast
   */
  success(message, title) {
    getToastAdapter().success(message, title);
  },
  /**
   * Show an error toast
   */
  error(message, title) {
    getToastAdapter().error(message, title);
  },
  /**
   * Show an info toast
   */
  info(message, title) {
    getToastAdapter().info(message, title);
  }
};
function useToast() {
  return toast;
}

// src/design/tokens.ts
var primitives = {
  colors: {
    // Brand colors (HSL values)
    purple: {
      50: "hsl(285, 100%, 97%)",
      100: "hsl(285, 100%, 94%)",
      200: "hsl(285, 100%, 88%)",
      300: "hsl(285, 100%, 76%)",
      400: "hsl(285, 100%, 60%)",
      500: "hsl(285, 100%, 50%)",
      600: "hsl(285, 100%, 40%)",
      700: "hsl(285, 100%, 34%)",
      // Primary brand color
      800: "hsl(285, 100%, 28%)",
      900: "hsl(285, 100%, 22%)",
      950: "hsl(285, 100%, 12%)"
    },
    blue: {
      50: "hsl(210, 100%, 97%)",
      100: "hsl(210, 100%, 94%)",
      200: "hsl(210, 100%, 86%)",
      300: "hsl(210, 100%, 74%)",
      400: "hsl(210, 100%, 62%)",
      500: "hsl(210, 100%, 50%)",
      // Secondary
      600: "hsl(210, 100%, 42%)",
      700: "hsl(210, 100%, 34%)",
      800: "hsl(210, 100%, 26%)",
      900: "hsl(210, 100%, 18%)"
    },
    pink: {
      50: "hsl(330, 100%, 97%)",
      100: "hsl(330, 100%, 94%)",
      200: "hsl(330, 100%, 88%)",
      300: "hsl(330, 100%, 76%)",
      400: "hsl(330, 100%, 68%)",
      500: "hsl(330, 100%, 60%)",
      // Accent
      600: "hsl(330, 100%, 50%)",
      700: "hsl(330, 100%, 42%)",
      800: "hsl(330, 100%, 34%)",
      900: "hsl(330, 100%, 26%)"
    },
    green: {
      50: "hsl(145, 80%, 96%)",
      100: "hsl(145, 80%, 90%)",
      200: "hsl(145, 80%, 80%)",
      300: "hsl(145, 80%, 65%)",
      400: "hsl(145, 80%, 52%)",
      500: "hsl(145, 80%, 45%)",
      // Success
      600: "hsl(145, 80%, 36%)",
      700: "hsl(145, 80%, 28%)",
      800: "hsl(145, 80%, 20%)",
      900: "hsl(145, 80%, 12%)"
    },
    orange: {
      50: "hsl(35, 100%, 96%)",
      100: "hsl(35, 100%, 90%)",
      200: "hsl(35, 100%, 82%)",
      300: "hsl(35, 100%, 70%)",
      400: "hsl(35, 100%, 60%)",
      500: "hsl(35, 100%, 55%)",
      // Warning
      600: "hsl(35, 100%, 45%)",
      700: "hsl(35, 100%, 36%)",
      800: "hsl(35, 100%, 28%)",
      900: "hsl(35, 100%, 20%)"
    },
    red: {
      50: "hsl(0, 85%, 97%)",
      100: "hsl(0, 85%, 93%)",
      200: "hsl(0, 85%, 86%)",
      300: "hsl(0, 85%, 75%)",
      400: "hsl(0, 85%, 65%)",
      500: "hsl(0, 85%, 55%)",
      // Error
      600: "hsl(0, 85%, 46%)",
      700: "hsl(0, 85%, 38%)",
      800: "hsl(0, 85%, 30%)",
      900: "hsl(0, 85%, 22%)"
    },
    yellow: {
      50: "hsl(45, 100%, 96%)",
      100: "hsl(45, 100%, 90%)",
      200: "hsl(45, 100%, 80%)",
      300: "hsl(45, 100%, 68%)",
      400: "hsl(45, 100%, 56%)",
      500: "hsl(45, 100%, 50%)",
      // Celebration
      600: "hsl(45, 100%, 42%)",
      700: "hsl(45, 100%, 34%)",
      800: "hsl(45, 100%, 26%)",
      900: "hsl(45, 100%, 18%)"
    },
    gray: {
      50: "hsl(220, 14%, 98%)",
      100: "hsl(220, 14%, 96%)",
      200: "hsl(220, 13%, 91%)",
      300: "hsl(218, 12%, 83%)",
      400: "hsl(217, 10%, 65%)",
      500: "hsl(217, 9%, 50%)",
      600: "hsl(217, 9%, 40%)",
      700: "hsl(215, 11%, 30%)",
      800: "hsl(217, 14%, 18%)",
      900: "hsl(222, 47%, 11%)",
      950: "hsl(229, 84%, 5%)"
    },
    white: "hsl(0, 0%, 100%)",
    black: "hsl(0, 0%, 0%)"
  },
  spacing: {
    0: "0",
    px: "1px",
    0.5: "0.125rem",
    // 2px
    1: "0.25rem",
    // 4px
    1.5: "0.375rem",
    // 6px
    2: "0.5rem",
    // 8px
    2.5: "0.625rem",
    // 10px
    3: "0.75rem",
    // 12px
    3.5: "0.875rem",
    // 14px
    4: "1rem",
    // 16px
    5: "1.25rem",
    // 20px
    6: "1.5rem",
    // 24px
    7: "1.75rem",
    // 28px
    8: "2rem",
    // 32px
    9: "2.25rem",
    // 36px
    10: "2.5rem",
    // 40px
    11: "2.75rem",
    // 44px
    12: "3rem",
    // 48px
    14: "3.5rem",
    // 56px
    16: "4rem",
    // 64px
    20: "5rem",
    // 80px
    24: "6rem",
    // 96px
    28: "7rem",
    // 112px
    32: "8rem"
    // 128px
  },
  radius: {
    none: "0",
    sm: "0.25rem",
    // 4px
    md: "0.5rem",
    // 8px
    lg: "0.75rem",
    // 12px
    xl: "1rem",
    // 16px
    "2xl": "1.25rem",
    // 20px
    "3xl": "1.5rem",
    // 24px
    full: "9999px"
  },
  fontSize: {
    xs: "0.75rem",
    // 12px
    sm: "0.875rem",
    // 14px
    base: "1rem",
    // 16px
    lg: "1.125rem",
    // 18px
    xl: "1.25rem",
    // 20px
    "2xl": "1.5rem",
    // 24px
    "3xl": "1.875rem",
    // 30px
    "4xl": "2.25rem",
    // 36px
    "5xl": "3rem",
    // 48px
    "6xl": "3.75rem"
    // 60px
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2"
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800"
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
  },
  duration: {
    0: "0ms",
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1e3: "1000ms"
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    // Fun, bouncy easings (Duolingo-inspired)
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  },
  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50"
  }
};
var semantic = {
  colors: {
    // Brand
    brand: {
      primary: "var(--brand-primary)",
      primaryHover: "var(--brand-primary-hover)",
      primaryActive: "var(--brand-primary-active)",
      primarySubtle: "var(--brand-primary-subtle)",
      secondary: "var(--brand-secondary)",
      secondaryHover: "var(--brand-secondary-hover)",
      accent: "var(--brand-accent)",
      accentHover: "var(--brand-accent-hover)"
    },
    // Backgrounds
    background: {
      page: "var(--bg-page)",
      surface: "var(--bg-surface)",
      elevated: "var(--bg-elevated)",
      sunken: "var(--bg-sunken)",
      overlay: "var(--bg-overlay)",
      interactive: "var(--bg-interactive)",
      interactiveHover: "var(--bg-interactive-hover)",
      interactiveActive: "var(--bg-interactive-active)",
      success: "var(--bg-success)",
      successSubtle: "var(--bg-success-subtle)",
      warning: "var(--bg-warning)",
      warningSubtle: "var(--bg-warning-subtle)",
      error: "var(--bg-error)",
      errorSubtle: "var(--bg-error-subtle)",
      info: "var(--bg-info)",
      infoSubtle: "var(--bg-info-subtle)"
    },
    // Text
    text: {
      primary: "var(--text-primary)",
      secondary: "var(--text-secondary)",
      tertiary: "var(--text-tertiary)",
      muted: "var(--text-muted)",
      disabled: "var(--text-disabled)",
      heading: "var(--text-heading)",
      body: "var(--text-body)",
      caption: "var(--text-caption)",
      onPrimary: "var(--text-on-primary)",
      onSurface: "var(--text-on-surface)",
      onError: "var(--text-on-error)",
      link: "var(--text-link)",
      linkHover: "var(--text-link-hover)",
      success: "var(--text-success)",
      warning: "var(--text-warning)",
      error: "var(--text-error)"
    },
    // Borders
    border: {
      default: "var(--border-default)",
      strong: "var(--border-strong)",
      subtle: "var(--border-subtle)",
      focus: "var(--border-focus)",
      error: "var(--border-error)",
      success: "var(--border-success)"
    },
    // States
    state: {
      focusRing: "var(--state-focus-ring)",
      selection: "var(--state-selection)",
      highlight: "var(--state-highlight)"
    },
    // Fun/celebration colors (Duolingo/Discord inspired)
    fun: {
      celebration: "var(--fun-celebration)",
      achievement: "var(--fun-achievement)",
      streak: "var(--fun-streak)",
      party: "var(--fun-party)"
    }
  },
  // Typography
  typography: {
    heading: {
      display: {
        fontSize: "var(--font-size-display)",
        lineHeight: "var(--line-height-display)",
        fontWeight: "var(--font-weight-display)",
        letterSpacing: "var(--letter-spacing-display)"
      },
      h1: {
        fontSize: "var(--font-size-h1)",
        lineHeight: "var(--line-height-h1)",
        fontWeight: "var(--font-weight-h1)"
      },
      h2: {
        fontSize: "var(--font-size-h2)",
        lineHeight: "var(--line-height-h2)",
        fontWeight: "var(--font-weight-h2)"
      },
      h3: {
        fontSize: "var(--font-size-h3)",
        lineHeight: "var(--line-height-h3)",
        fontWeight: "var(--font-weight-h3)"
      },
      h4: {
        fontSize: "var(--font-size-h4)",
        lineHeight: "var(--line-height-h4)",
        fontWeight: "var(--font-weight-h4)"
      }
    },
    body: {
      lg: {
        fontSize: "var(--font-size-body-lg)",
        lineHeight: "var(--line-height-body-lg)"
      },
      md: {
        fontSize: "var(--font-size-body-md)",
        lineHeight: "var(--line-height-body-md)"
      },
      sm: {
        fontSize: "var(--font-size-body-sm)",
        lineHeight: "var(--line-height-body-sm)"
      },
      xs: {
        fontSize: "var(--font-size-body-xs)",
        lineHeight: "var(--line-height-body-xs)"
      }
    },
    ui: {
      label: {
        fontSize: "var(--font-size-label)",
        lineHeight: "var(--line-height-label)",
        fontWeight: "var(--font-weight-label)"
      },
      button: {
        fontSize: "var(--font-size-button)",
        lineHeight: "var(--line-height-button)",
        fontWeight: "var(--font-weight-button)"
      },
      caption: {
        fontSize: "var(--font-size-caption)",
        lineHeight: "var(--line-height-caption)"
      },
      overline: {
        fontSize: "var(--font-size-overline)",
        lineHeight: "var(--line-height-overline)",
        letterSpacing: "var(--letter-spacing-overline)",
        textTransform: "uppercase"
      },
      badge: {
        fontSize: "var(--font-size-badge)",
        lineHeight: "var(--line-height-badge)",
        fontWeight: "var(--font-weight-badge)"
      }
    },
    fontFamily: {
      sans: "var(--font-sans)",
      heading: "var(--font-heading)",
      mono: "var(--font-mono)"
    }
  },
  // Spacing (semantic purposes)
  spacing: {
    // Inset (padding)
    inset: {
      none: "0",
      xs: "var(--inset-xs)",
      // 4px
      sm: "var(--inset-sm)",
      // 8px
      md: "var(--inset-md)",
      // 16px
      lg: "var(--inset-lg)",
      // 24px
      xl: "var(--inset-xl)",
      // 32px
      "2xl": "var(--inset-2xl)"
      // 48px
    },
    // Stack (vertical gaps between elements)
    stack: {
      xs: "var(--stack-xs)",
      // 4px
      sm: "var(--stack-sm)",
      // 8px
      md: "var(--stack-md)",
      // 16px
      lg: "var(--stack-lg)",
      // 24px
      xl: "var(--stack-xl)",
      // 32px
      section: "var(--stack-section)"
      // 48px
    },
    // Inline (horizontal gaps)
    inline: {
      xs: "var(--inline-xs)",
      // 4px
      sm: "var(--inline-sm)",
      // 8px
      md: "var(--inline-md)",
      // 16px
      lg: "var(--inline-lg)"
      // 24px
    },
    // Layout
    layout: {
      pageMargin: "var(--layout-page-margin)",
      sectionGap: "var(--layout-section-gap)",
      containerPadding: "var(--layout-container-padding)"
    }
  },
  // Border Radius (dramatically rounded - Duolingo style)
  radius: {
    shape: {
      none: "0",
      subtle: "var(--shape-subtle)",
      // 8px
      soft: "var(--shape-soft)",
      // 16px
      rounded: "var(--shape-rounded)",
      // 20px
      pill: "var(--shape-pill)",
      // 9999px
      circle: "50%"
    },
    component: {
      button: "var(--radius-button)",
      // 16px - very rounded like Duolingo
      card: "var(--radius-card)",
      // 20px - friendly, approachable
      input: "var(--radius-input)",
      // 12px
      badge: "var(--radius-badge)",
      // pill
      avatar: "var(--radius-avatar)",
      // circle
      modal: "var(--radius-modal)",
      // 24px
      tooltip: "var(--radius-tooltip)",
      // 12px
      dropdown: "var(--radius-dropdown)",
      // 16px
      sheet: "var(--radius-sheet)"
      // 24px (top corners)
    }
  },
  // Shadows (elevation system)
  shadow: {
    elevation: {
      none: "none",
      raised: "var(--shadow-raised)",
      // Cards, buttons
      floating: "var(--shadow-floating)",
      // Dropdowns, popovers
      overlay: "var(--shadow-overlay)",
      // Modals, sheets
      popup: "var(--shadow-popup)"
      // Tooltips, toasts
    },
    fun: {
      pop: "var(--shadow-pop)",
      // Playful depth effect
      glow: "var(--shadow-glow)",
      // Colored glow around elements
      bounce: "var(--shadow-bounce)"
      // Pressed/active state shadow
    }
  },
  // Animation
  animation: {
    duration: {
      instant: "var(--duration-instant)",
      // 0ms
      micro: "var(--duration-micro)",
      // 100ms
      fast: "var(--duration-fast)",
      // 150ms
      normal: "var(--duration-normal)",
      // 200ms
      slow: "var(--duration-slow)",
      // 300ms
      slower: "var(--duration-slower)"
      // 500ms
    },
    easing: {
      default: "var(--easing-default)",
      enter: "var(--easing-enter)",
      exit: "var(--easing-exit)",
      bounce: "var(--easing-bounce)",
      spring: "var(--easing-spring)"
    }
  },
  // Z-Index
  zIndex: {
    // Local stacking (within components, use for relative positioning)
    lifted: "var(--z-lifted)",
    // 1 - Slightly above siblings
    float: "var(--z-float)",
    // 2 - Floating above local content
    top: "var(--z-top)",
    // 3 - Topmost in local context
    // Global stacking (for overlays, modals, etc.)
    base: "var(--z-base)",
    // 0
    dropdown: "var(--z-dropdown)",
    // 10
    sticky: "var(--z-sticky)",
    // 20
    modal: "var(--z-modal)",
    // 30
    popover: "var(--z-popover)",
    // 40
    toast: "var(--z-toast)",
    // 50
    tooltip: "var(--z-tooltip)",
    // 60
    overlay: "var(--z-overlay)"
    // 70
  }
};
var components = {
  button: {
    radius: semantic.radius.component.button,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    fontSize: semantic.typography.ui.button.fontSize,
    fontWeight: semantic.typography.ui.button.fontWeight,
    transition: `all ${primitives.duration[150]} ${primitives.easing.bounce}`,
    sizes: {
      sm: {
        height: "2rem",
        // 32px
        paddingX: semantic.spacing.inset.sm,
        fontSize: primitives.fontSize.sm
      },
      md: {
        height: "2.5rem",
        // 40px
        paddingX: semantic.spacing.inset.md,
        fontSize: primitives.fontSize.sm
      },
      lg: {
        height: "2.75rem",
        // 44px
        paddingX: semantic.spacing.inset.lg,
        fontSize: primitives.fontSize.base
      },
      icon: {
        size: "2.5rem",
        // 40px
        padding: semantic.spacing.inset.sm
      }
    }
  },
  card: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.raised,
    borderWidth: "1px",
    gap: semantic.spacing.stack.md
  },
  input: {
    radius: semantic.radius.component.input,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    height: "2.5rem",
    // 40px
    fontSize: primitives.fontSize.sm,
    borderWidth: "1px",
    transition: `border-color ${primitives.duration[150]} ${primitives.easing.inOut}`
  },
  badge: {
    radius: semantic.radius.component.badge,
    paddingX: semantic.spacing.inset.sm,
    paddingY: semantic.spacing.inset.xs,
    fontSize: semantic.typography.ui.badge.fontSize,
    fontWeight: semantic.typography.ui.badge.fontWeight
  },
  avatar: {
    radius: semantic.radius.component.avatar,
    sizes: {
      xs: "1.5rem",
      // 24px
      sm: "2rem",
      // 32px
      md: "2.5rem",
      // 40px
      lg: "3rem",
      // 48px
      xl: "4rem",
      // 64px
      "2xl": "5rem"
      // 80px
    }
  },
  modal: {
    radius: semantic.radius.component.modal,
    padding: semantic.spacing.inset.xl,
    shadow: semantic.shadow.elevation.overlay,
    maxWidth: "32rem",
    // 512px
    gap: semantic.spacing.stack.lg
  },
  sheet: {
    radius: semantic.radius.component.sheet,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.overlay
  },
  popover: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.sm,
    shadow: semantic.shadow.elevation.floating,
    minWidth: "8rem"
    // 128px
  },
  tooltip: {
    radius: semantic.radius.component.tooltip,
    padding: `${semantic.spacing.inset.xs} ${semantic.spacing.inset.sm}`,
    shadow: semantic.shadow.elevation.popup,
    fontSize: primitives.fontSize.sm
  },
  dropdown: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.xs,
    shadow: semantic.shadow.elevation.floating,
    itemPaddingX: semantic.spacing.inset.sm,
    itemPaddingY: semantic.spacing.inset.xs,
    itemRadius: semantic.radius.shape.subtle
  },
  tabs: {
    radius: semantic.radius.shape.subtle,
    padding: semantic.spacing.inset.sm,
    gap: semantic.spacing.inline.xs
  },
  checkbox: {
    size: "1rem",
    // 16px
    radius: primitives.radius.sm,
    // 4px
    borderWidth: "2px"
  },
  switch: {
    width: "2.75rem",
    // 44px
    height: "1.5rem",
    // 24px
    thumbSize: "1.25rem",
    // 20px
    radius: semantic.radius.shape.pill
  },
  progress: {
    height: "0.5rem",
    // 8px
    radius: semantic.radius.shape.pill
  },
  skeleton: {
    radius: semantic.radius.shape.subtle
  },
  alert: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    iconSize: "1.25rem"
    // 20px
  },
  toast: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    shadow: semantic.shadow.elevation.popup
  }
};
var breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};
var colors = {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))"
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))"
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))"
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))"
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))"
  },
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))"
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))"
  },
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))"
};
var spacing = primitives.spacing;
var typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["Fira Code", "Monaco", "monospace"]
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }]
  },
  fontWeight: primitives.fontWeight
};
var borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px"
};
var shadows = primitives.shadows;
var animations = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms"
  },
  easing: {
    easeInOut: primitives.easing.inOut,
    easeOut: primitives.easing.out,
    easeIn: primitives.easing.in
  }
};

// src/design/themes/groupi-light.ts
var groupiLight = {
  // ==========================================================================
  // BRAND COLORS
  // ==========================================================================
  brand: {
    primary: "hsl(285, 100%, 34%)",
    primaryHover: "hsl(285, 100%, 28%)",
    primaryActive: "hsl(285, 100%, 24%)",
    primarySubtle: "hsl(285, 100%, 94%)",
    secondary: "hsl(210, 100%, 50%)",
    secondaryHover: "hsl(210, 100%, 42%)",
    accent: "hsl(330, 100%, 60%)",
    accentHover: "hsl(330, 100%, 50%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS
  // ==========================================================================
  background: {
    page: "hsl(0, 0%, 100%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(220, 14%, 96%)",
    overlay: "hsl(0, 0%, 0%, 0.5)",
    interactive: "hsl(220, 14%, 96%)",
    interactiveHover: "hsl(220, 13%, 91%)",
    interactiveActive: "hsl(218, 12%, 83%)",
    success: "hsl(145, 80%, 45%)",
    successSubtle: "hsl(145, 80%, 90%)",
    warning: "hsl(35, 100%, 55%)",
    warningSubtle: "hsl(35, 100%, 90%)",
    error: "hsl(0, 85%, 55%)",
    errorSubtle: "hsl(0, 85%, 93%)",
    info: "hsl(210, 100%, 50%)",
    infoSubtle: "hsl(210, 100%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS
  // ==========================================================================
  text: {
    primary: "hsl(222.2, 47.4%, 11.2%)",
    secondary: "hsl(217, 9%, 40%)",
    tertiary: "hsl(217, 10%, 50%)",
    muted: "hsl(215.4, 16.3%, 46.9%)",
    disabled: "hsl(217, 10%, 65%)",
    heading: "hsl(222.2, 47.4%, 11.2%)",
    body: "hsl(222.2, 47.4%, 11.2%)",
    caption: "hsl(217, 9%, 40%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(222.2, 47.4%, 11.2%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(285, 100%, 34%)",
    linkHover: "hsl(285, 100%, 28%)",
    success: "hsl(145, 80%, 28%)",
    warning: "hsl(35, 100%, 36%)",
    error: "hsl(0, 85%, 46%)"
  },
  // ==========================================================================
  // BORDER COLORS
  // ==========================================================================
  border: {
    default: "hsl(214.3, 31.8%, 91.4%)",
    strong: "hsl(218, 12%, 83%)",
    subtle: "hsl(220, 13%, 95%)",
    focus: "hsl(285, 100%, 34%)",
    error: "hsl(0, 85%, 55%)",
    success: "hsl(145, 80%, 45%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(285, 100%, 34%, 0.4)",
    selection: "hsl(285, 100%, 34%, 0.15)",
    highlight: "hsl(45, 100%, 50%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Duolingo/Discord inspired)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 50%)",
    achievement: "hsl(145, 80%, 45%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(330, 100%, 60%)"
  },
  // ==========================================================================
  // SHADOWS
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.1)",
    glow: "0 0 20px 0 hsl(285 100% 34% / 0.3)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(0, 0%, 100%)",
    foreground: "hsl(222.2, 47.4%, 11.2%)",
    muted: "hsl(210, 40%, 96.1%)",
    mutedForeground: "hsl(215.4, 16.3%, 46.9%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(222.2, 47.4%, 11.2%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(222.2, 47.4%, 11.2%)",
    border: "hsl(214.3, 31.8%, 91.4%)",
    input: "hsl(214.3, 31.8%, 91.4%)",
    primary: "hsl(285, 100%, 34%)",
    primaryForeground: "hsl(210, 40%, 98%)",
    secondary: "hsl(210, 40%, 96.1%)",
    secondaryForeground: "hsl(222.2, 47.4%, 11.2%)",
    accent: "hsl(260, 40%, 96.1%)",
    accentForeground: "hsl(273.2, 47.4%, 11.2%)",
    destructive: "hsl(0, 85%, 55%)",
    destructiveForeground: "hsl(210, 40%, 98%)",
    ring: "hsl(215, 20.2%, 65.1%)",
    radius: "0.5rem"
  }
};
var sharedTokens = {
  // Spacing - Inset (padding)
  spacing: {
    inset: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem",
      // 24px
      xl: "2rem",
      // 32px
      "2xl": "3rem"
      // 48px
    },
    stack: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem",
      // 24px
      xl: "2rem",
      // 32px
      section: "3rem"
      // 48px
    },
    inline: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem"
      // 24px
    },
    layout: {
      pageMargin: "1rem",
      sectionGap: "3rem",
      containerPadding: "2rem"
    }
  },
  // Border Radius - Dramatically Rounded (Duolingo style)
  radius: {
    shape: {
      subtle: "0.5rem",
      // 8px - standard
      soft: "1rem",
      // 16px - cards, containers
      rounded: "1.25rem",
      // 20px - modals, large elements
      pill: "9999px"
      // Pill shape
    },
    component: {
      button: "1rem",
      // 16px - very rounded like Duolingo
      card: "1.25rem",
      // 20px - friendly, approachable
      input: "0.75rem",
      // 12px - rounded inputs
      badge: "9999px",
      // Pill-shaped badges
      avatar: "50%",
      // Circular avatars
      modal: "1.5rem",
      // 24px - very soft modals
      tooltip: "0.75rem",
      // 12px
      dropdown: "1rem",
      // 16px
      sheet: "1.5rem"
      // 24px - top corners for sheets
    }
  },
  // Animation Duration
  duration: {
    instant: "0ms",
    micro: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms"
  },
  // Animation Easing
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  // Z-Index
  // Local stacking: Use for relative positioning within components (1-3)
  // Global stacking: Use for overlays, modals, etc. (40+)
  // Note: dropdown > popover because dropdowns often open from inside popovers
  zIndex: {
    // Local stacking (within components)
    lifted: 1,
    // Slightly above siblings
    float: 2,
    // Floating above local content
    top: 3,
    // Topmost in local context
    // Global stacking (overlays, fixed elements)
    base: 0,
    sticky: 40,
    popover: 50,
    dropdown: 60,
    modal: 70,
    toast: 80,
    tooltip: 90,
    overlay: 100
  },
  // Typography
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      mono: '"Fira Code", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
    },
    fontSize: {
      display: "3rem",
      h1: "2.25rem",
      h2: "1.875rem",
      h3: "1.5rem",
      h4: "1.25rem",
      bodyLg: "1.125rem",
      bodyMd: "1rem",
      bodySm: "0.875rem",
      bodyXs: "0.75rem",
      label: "0.875rem",
      button: "0.875rem",
      caption: "0.75rem",
      overline: "0.75rem",
      badge: "0.75rem"
    },
    lineHeight: {
      display: "1.1",
      h1: "1.2",
      h2: "1.3",
      h3: "1.4",
      h4: "1.4",
      bodyLg: "1.75",
      bodyMd: "1.5",
      bodySm: "1.5",
      bodyXs: "1.5",
      label: "1.5",
      button: "1.25",
      caption: "1.5",
      overline: "1.5",
      badge: "1"
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800"
    },
    letterSpacing: {
      display: "-0.02em",
      overline: "0.05em"
    }
  }
};

// src/design/themes/groupi-dark.ts
var groupiDark = {
  // ==========================================================================
  // BRAND COLORS (Dark Mode - refined for dark backgrounds)
  // ==========================================================================
  brand: {
    primary: "hsl(280, 85%, 60%)",
    // Softened purple, still vibrant
    primaryHover: "hsl(280, 85%, 68%)",
    primaryActive: "hsl(280, 85%, 52%)",
    primarySubtle: "hsl(280, 40%, 15%)",
    secondary: "hsl(210, 90%, 62%)",
    secondaryHover: "hsl(210, 90%, 70%)",
    accent: "hsl(330, 85%, 62%)",
    // Pink accent
    accentHover: "hsl(330, 85%, 70%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Rich Purple Dark - matches Ocean's color relationship)
  // Saturated violet (hue 270, 35-50% sat) complements purple primary (hue 280)
  // ==========================================================================
  background: {
    page: "hsl(270, 45%, 7%)",
    // Deep rich purple
    surface: "hsl(270, 40%, 11%)",
    // Cards, containers
    elevated: "hsl(270, 35%, 15%)",
    // Popovers, dropdowns
    sunken: "hsl(270, 50%, 5%)",
    // Recessed areas
    overlay: "hsla(270, 45%, 4%, 0.85)",
    interactive: "hsl(270, 38%, 13%)",
    interactiveHover: "hsl(270, 35%, 19%)",
    interactiveActive: "hsl(270, 32%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(210, 90%, 52%)",
    infoSubtle: "hsl(210, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast with purple tint)
  // ==========================================================================
  text: {
    primary: "hsl(270, 20%, 94%)",
    // Warm white with purple tint
    secondary: "hsl(270, 18%, 72%)",
    // Softer secondary text
    tertiary: "hsl(270, 15%, 60%)",
    muted: "hsl(270, 15%, 55%)",
    disabled: "hsl(270, 12%, 40%)",
    heading: "hsl(270, 25%, 97%)",
    // Crisp headings
    body: "hsl(270, 20%, 92%)",
    caption: "hsl(270, 18%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(0, 0%, 95%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(280, 85%, 70%)",
    // Matches softened primary
    linkHover: "hsl(280, 85%, 78%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode - rich purple to match backgrounds)
  // ==========================================================================
  border: {
    default: "hsl(270, 30%, 20%)",
    // Visible purple borders
    strong: "hsl(270, 28%, 28%)",
    subtle: "hsl(270, 35%, 14%)",
    focus: "hsl(280, 85%, 60%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(280, 85%, 60%, 0.5)",
    selection: "hsl(280, 85%, 60%, 0.25)",
    highlight: "hsl(45, 100%, 50%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - vibrant)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 58%)",
    achievement: "hsl(145, 70%, 52%)",
    streak: "hsl(25, 95%, 58%)",
    party: "hsl(330, 85%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - deeper shadows for depth)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(280 85% 60% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(270, 45%, 7%)",
    foreground: "hsl(270, 20%, 94%)",
    muted: "hsl(270, 38%, 13%)",
    mutedForeground: "hsl(270, 15%, 55%)",
    popover: "hsl(270, 35%, 15%)",
    popoverForeground: "hsl(270, 18%, 72%)",
    card: "hsl(270, 40%, 11%)",
    cardForeground: "hsl(270, 20%, 94%)",
    border: "hsl(270, 30%, 20%)",
    input: "hsl(270, 30%, 20%)",
    primary: "hsl(280, 85%, 60%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(270, 38%, 13%)",
    secondaryForeground: "hsl(270, 20%, 94%)",
    accent: "hsl(280, 35%, 18%)",
    accentForeground: "hsl(280, 25%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(280, 85%, 60%)",
    radius: "0.5rem"
  }
};

// src/design/themes/oled-dark.ts
var oledDark = {
  // ==========================================================================
  // BRAND COLORS - Extra vibrant for contrast against pure black
  // ==========================================================================
  brand: {
    primary: "hsl(280, 90%, 65%)",
    // Vibrant purple
    primaryHover: "hsl(280, 90%, 72%)",
    primaryActive: "hsl(280, 90%, 58%)",
    primarySubtle: "hsl(280, 50%, 12%)",
    secondary: "hsl(210, 95%, 65%)",
    secondaryHover: "hsl(210, 95%, 72%)",
    accent: "hsl(330, 90%, 65%)",
    // Hot pink accent
    accentHover: "hsl(330, 90%, 72%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (True Black for OLED)
  // Pure black page, minimal elevation differences using transparency
  // ==========================================================================
  background: {
    page: "hsl(0, 0%, 0%)",
    // True black
    surface: "hsl(0, 0%, 6%)",
    // Barely lifted
    elevated: "hsl(0, 0%, 10%)",
    // Popovers, dropdowns
    sunken: "hsl(0, 0%, 0%)",
    // Same as page
    overlay: "hsla(0, 0%, 0%, 0.85)",
    interactive: "hsl(0, 0%, 8%)",
    interactiveHover: "hsl(0, 0%, 14%)",
    interactiveActive: "hsl(0, 0%, 18%)",
    success: "hsl(145, 75%, 40%)",
    successSubtle: "hsl(145, 50%, 10%)",
    warning: "hsl(38, 95%, 52%)",
    warningSubtle: "hsl(38, 50%, 10%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 50%, 10%)",
    info: "hsl(210, 95%, 55%)",
    infoSubtle: "hsl(210, 50%, 10%)"
  },
  // ==========================================================================
  // TEXT COLORS (Maximum contrast for OLED)
  // ==========================================================================
  text: {
    primary: "hsl(0, 0%, 98%)",
    // Almost pure white
    secondary: "hsl(0, 0%, 72%)",
    tertiary: "hsl(0, 0%, 58%)",
    muted: "hsl(0, 0%, 50%)",
    disabled: "hsl(0, 0%, 35%)",
    heading: "hsl(0, 0%, 100%)",
    // Pure white headings
    body: "hsl(0, 0%, 96%)",
    caption: "hsl(0, 0%, 65%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(0, 0%, 98%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(280, 90%, 72%)",
    linkHover: "hsl(280, 90%, 80%)",
    success: "hsl(145, 75%, 60%)",
    warning: "hsl(38, 95%, 65%)",
    error: "hsl(0, 70%, 65%)"
  },
  // ==========================================================================
  // BORDER COLORS (Subtle on true black)
  // ==========================================================================
  border: {
    default: "hsl(0, 0%, 16%)",
    strong: "hsl(0, 0%, 24%)",
    subtle: "hsl(0, 0%, 10%)",
    focus: "hsl(280, 90%, 65%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 75%, 40%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(280, 90%, 65%, 0.5)",
    selection: "hsl(280, 90%, 65%, 0.3)",
    highlight: "hsl(45, 100%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Extra vibrant on black)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 60%)",
    achievement: "hsl(145, 75%, 55%)",
    streak: "hsl(25, 100%, 60%)",
    party: "hsl(330, 90%, 65%)"
  },
  // ==========================================================================
  // SHADOWS (Minimal - black on black doesn't need much)
  // Using colored glows for depth instead
  // ==========================================================================
  shadow: {
    raised: "0 1px 2px 0 rgb(0 0 0 / 0.5)",
    floating: "0 4px 8px -2px rgb(0 0 0 / 0.6)",
    overlay: "0 16px 32px -8px rgb(0 0 0 / 0.7)",
    popup: "0 8px 16px -4px rgb(0 0 0 / 0.6)",
    pop: "0 3px 0 0 rgb(0 0 0 / 0.5)",
    glow: "0 0 24px 0 hsl(280 90% 65% / 0.4)",
    // Purple glow
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(0, 0%, 0%)",
    foreground: "hsl(0, 0%, 98%)",
    muted: "hsl(0, 0%, 8%)",
    mutedForeground: "hsl(0, 0%, 50%)",
    popover: "hsl(0, 0%, 6%)",
    popoverForeground: "hsl(0, 0%, 72%)",
    card: "hsl(0, 0%, 6%)",
    cardForeground: "hsl(0, 0%, 98%)",
    border: "hsl(0, 0%, 16%)",
    input: "hsl(0, 0%, 16%)",
    primary: "hsl(280, 90%, 65%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(0, 0%, 10%)",
    secondaryForeground: "hsl(0, 0%, 98%)",
    accent: "hsl(280, 40%, 15%)",
    accentForeground: "hsl(280, 40%, 95%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 100%)",
    ring: "hsl(280, 90%, 65%)",
    radius: "0.5rem"
  }
};

// src/design/themes/ocean-light.ts
var oceanLight = {
  // ==========================================================================
  // BRAND COLORS - Ocean blues
  // ==========================================================================
  brand: {
    primary: "hsl(200, 85%, 40%)",
    primaryHover: "hsl(200, 85%, 34%)",
    primaryActive: "hsl(200, 85%, 30%)",
    primarySubtle: "hsl(200, 85%, 94%)",
    secondary: "hsl(180, 70%, 40%)",
    secondaryHover: "hsl(180, 70%, 34%)",
    accent: "hsl(170, 80%, 45%)",
    accentHover: "hsl(170, 80%, 38%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS
  // ==========================================================================
  background: {
    page: "hsl(200, 30%, 99%)",
    surface: "hsl(200, 20%, 100%)",
    elevated: "hsl(200, 25%, 100%)",
    sunken: "hsl(200, 25%, 96%)",
    overlay: "hsl(200, 30%, 10%, 0.5)",
    interactive: "hsl(200, 20%, 96%)",
    interactiveHover: "hsl(200, 22%, 91%)",
    interactiveActive: "hsl(200, 18%, 85%)",
    success: "hsl(160, 75%, 42%)",
    successSubtle: "hsl(160, 75%, 92%)",
    warning: "hsl(38, 95%, 52%)",
    warningSubtle: "hsl(38, 95%, 92%)",
    error: "hsl(0, 75%, 55%)",
    errorSubtle: "hsl(0, 75%, 94%)",
    info: "hsl(200, 85%, 50%)",
    infoSubtle: "hsl(200, 85%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS
  // ==========================================================================
  text: {
    primary: "hsl(200, 35%, 15%)",
    secondary: "hsl(200, 20%, 40%)",
    tertiary: "hsl(200, 15%, 50%)",
    muted: "hsl(200, 12%, 50%)",
    disabled: "hsl(200, 10%, 65%)",
    heading: "hsl(200, 40%, 12%)",
    body: "hsl(200, 35%, 15%)",
    caption: "hsl(200, 20%, 40%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(200, 35%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(200, 85%, 40%)",
    linkHover: "hsl(200, 85%, 30%)",
    success: "hsl(160, 75%, 28%)",
    warning: "hsl(38, 95%, 36%)",
    error: "hsl(0, 75%, 46%)"
  },
  // ==========================================================================
  // BORDER COLORS
  // ==========================================================================
  border: {
    default: "hsl(200, 25%, 88%)",
    strong: "hsl(200, 20%, 78%)",
    subtle: "hsl(200, 30%, 94%)",
    focus: "hsl(200, 85%, 40%)",
    error: "hsl(0, 75%, 55%)",
    success: "hsl(160, 75%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(200, 85%, 40%, 0.4)",
    selection: "hsl(200, 85%, 40%, 0.15)",
    highlight: "hsl(170, 80%, 45%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 50%)",
    achievement: "hsl(160, 75%, 42%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(170, 80%, 45%)"
  },
  // ==========================================================================
  // SHADOWS
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(200 30% 20% / 0.08), 0 1px 2px -1px hsl(200 30% 20% / 0.08)",
    floating: "0 4px 6px -1px hsl(200 30% 20% / 0.08), 0 2px 4px -2px hsl(200 30% 20% / 0.08)",
    overlay: "0 20px 25px -5px hsl(200 30% 20% / 0.1), 0 8px 10px -6px hsl(200 30% 20% / 0.08)",
    popup: "0 10px 15px -3px hsl(200 30% 20% / 0.08), 0 4px 6px -4px hsl(200 30% 20% / 0.08)",
    pop: "0 4px 0 0 hsl(200 30% 20% / 0.08)",
    glow: "0 0 20px 0 hsl(200 85% 40% / 0.3)",
    bounce: "0 2px 0 0 hsl(200 30% 20% / 0.08)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(200, 30%, 99%)",
    foreground: "hsl(200, 35%, 15%)",
    muted: "hsl(200, 25%, 96%)",
    mutedForeground: "hsl(200, 12%, 50%)",
    popover: "hsl(200, 20%, 100%)",
    popoverForeground: "hsl(200, 35%, 15%)",
    card: "hsl(200, 20%, 100%)",
    cardForeground: "hsl(200, 35%, 15%)",
    border: "hsl(200, 25%, 88%)",
    input: "hsl(200, 25%, 88%)",
    primary: "hsl(200, 85%, 40%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(200, 25%, 96%)",
    secondaryForeground: "hsl(200, 35%, 15%)",
    accent: "hsl(170, 30%, 95%)",
    accentForeground: "hsl(170, 40%, 15%)",
    destructive: "hsl(0, 75%, 55%)",
    destructiveForeground: "hsl(0, 0%, 100%)",
    ring: "hsl(200, 25%, 65%)",
    radius: "0.5rem"
  }
};

// src/design/themes/ocean-dark.ts
var oceanDark = {
  // ==========================================================================
  // BRAND COLORS - Bright ocean blues for dark mode
  // ==========================================================================
  brand: {
    primary: "hsl(200, 85%, 55%)",
    primaryHover: "hsl(200, 85%, 62%)",
    primaryActive: "hsl(200, 85%, 48%)",
    primarySubtle: "hsl(200, 60%, 15%)",
    secondary: "hsl(180, 70%, 50%)",
    secondaryHover: "hsl(180, 70%, 58%)",
    accent: "hsl(170, 80%, 50%)",
    accentHover: "hsl(170, 80%, 58%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep ocean blues)
  // ==========================================================================
  background: {
    page: "hsl(210, 50%, 6%)",
    surface: "hsl(210, 45%, 10%)",
    elevated: "hsl(210, 40%, 14%)",
    sunken: "hsl(210, 55%, 4%)",
    overlay: "hsl(210, 50%, 5%, 0.7)",
    interactive: "hsl(210, 40%, 14%)",
    interactiveHover: "hsl(210, 35%, 20%)",
    interactiveActive: "hsl(210, 30%, 25%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 50%, 12%)",
    warning: "hsl(38, 90%, 48%)",
    warningSubtle: "hsl(38, 50%, 12%)",
    error: "hsl(0, 65%, 48%)",
    errorSubtle: "hsl(0, 45%, 12%)",
    info: "hsl(200, 85%, 48%)",
    infoSubtle: "hsl(200, 50%, 12%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast)
  // ==========================================================================
  text: {
    primary: "hsl(200, 25%, 92%)",
    secondary: "hsl(200, 18%, 68%)",
    tertiary: "hsl(200, 14%, 58%)",
    muted: "hsl(200, 12%, 58%)",
    disabled: "hsl(200, 10%, 42%)",
    heading: "hsl(200, 30%, 96%)",
    body: "hsl(200, 25%, 92%)",
    caption: "hsl(200, 18%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(200, 25%, 92%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(200, 85%, 65%)",
    linkHover: "hsl(200, 85%, 75%)",
    success: "hsl(160, 70%, 55%)",
    warning: "hsl(38, 90%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(210, 35%, 18%)",
    strong: "hsl(210, 30%, 26%)",
    subtle: "hsl(210, 40%, 12%)",
    focus: "hsl(200, 85%, 55%)",
    error: "hsl(0, 65%, 48%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(200, 85%, 55%, 0.5)",
    selection: "hsl(200, 85%, 55%, 0.2)",
    highlight: "hsl(170, 80%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - brighter)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 55%)",
    achievement: "hsl(160, 70%, 50%)",
    streak: "hsl(25, 100%, 60%)",
    party: "hsl(170, 80%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - higher opacity)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(210 50% 5% / 0.3), 0 1px 2px -1px hsl(210 50% 5% / 0.3)",
    floating: "0 4px 6px -1px hsl(210 50% 5% / 0.4), 0 2px 4px -2px hsl(210 50% 5% / 0.3)",
    overlay: "0 20px 25px -5px hsl(210 50% 5% / 0.4), 0 8px 10px -6px hsl(210 50% 5% / 0.3)",
    popup: "0 10px 15px -3px hsl(210 50% 5% / 0.4), 0 4px 6px -4px hsl(210 50% 5% / 0.3)",
    pop: "0 4px 0 0 hsl(210 50% 5% / 0.3)",
    glow: "0 0 20px 0 hsl(200 85% 55% / 0.4)",
    bounce: "0 2px 0 0 hsl(210 50% 5% / 0.3)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(210, 50%, 6%)",
    foreground: "hsl(200, 25%, 92%)",
    muted: "hsl(210, 40%, 12%)",
    mutedForeground: "hsl(200, 12%, 58%)",
    popover: "hsl(210, 50%, 6%)",
    popoverForeground: "hsl(200, 18%, 68%)",
    card: "hsl(210, 50%, 6%)",
    cardForeground: "hsl(200, 25%, 92%)",
    border: "hsl(210, 35%, 18%)",
    input: "hsl(210, 35%, 18%)",
    primary: "hsl(200, 85%, 55%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(210, 40%, 14%)",
    secondaryForeground: "hsl(0, 0%, 98%)",
    accent: "hsl(200, 35%, 16%)",
    accentForeground: "hsl(170, 40%, 95%)",
    destructive: "hsl(0, 60%, 48%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(200, 85%, 55%)",
    radius: "0.5rem"
  }
};

// src/design/themes/transcend-light.ts
var transcendLight = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // For light mode, we use slightly darker versions for better contrast
  // ==========================================================================
  brand: {
    primary: "hsl(348, 70%, 65%)",
    // Darker pink for contrast
    primaryHover: "hsl(348, 70%, 58%)",
    primaryActive: "hsl(348, 70%, 52%)",
    primarySubtle: "hsl(348, 79%, 92%)",
    // Very soft pink
    secondary: "hsl(197, 80%, 50%)",
    // Darker blue for contrast
    secondaryHover: "hsl(197, 80%, 45%)",
    accent: "hsl(197, 80%, 50%)",
    // Trans blue as accent
    accentHover: "hsl(197, 80%, 45%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft pinks and whites with blue tints)
  // ==========================================================================
  background: {
    page: "hsl(348, 50%, 98%)",
    // Very soft pink-white
    surface: "hsl(0, 0%, 100%)",
    // Pure white cards
    elevated: "hsl(0, 0%, 100%)",
    // White elevated
    sunken: "hsl(348, 40%, 95%)",
    // Soft pink sunken
    overlay: "hsl(260, 25%, 10%, 0.6)",
    interactive: "hsl(197, 50%, 95%)",
    // Blue-tinted interactive
    interactiveHover: "hsl(197, 55%, 90%)",
    interactiveActive: "hsl(197, 60%, 85%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 50%, 92%)",
    warning: "hsl(38, 90%, 50%)",
    warningSubtle: "hsl(38, 70%, 92%)",
    error: "hsl(0, 70%, 50%)",
    errorSubtle: "hsl(0, 60%, 94%)",
    info: "hsl(197, 80%, 50%)",
    // Trans blue
    infoSubtle: "hsl(197, 70%, 92%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(260, 30%, 15%)",
    // Deep purple-black
    secondary: "hsl(260, 20%, 35%)",
    tertiary: "hsl(260, 15%, 50%)",
    muted: "hsl(260, 12%, 55%)",
    disabled: "hsl(260, 8%, 65%)",
    heading: "hsl(260, 35%, 12%)",
    body: "hsl(260, 25%, 18%)",
    caption: "hsl(260, 15%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(260, 30%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(197, 80%, 40%)",
    // Blue links
    linkHover: "hsl(197, 80%, 32%)",
    success: "hsl(160, 70%, 30%)",
    warning: "hsl(38, 90%, 35%)",
    error: "hsl(0, 70%, 45%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode - blue accented)
  // ==========================================================================
  border: {
    default: "hsl(197, 30%, 82%)",
    // Blue-tinted borders
    strong: "hsl(197, 35%, 70%)",
    subtle: "hsl(348, 30%, 90%)",
    // Pink-tinted subtle
    focus: "hsl(197, 80%, 50%)",
    // Blue focus
    error: "hsl(0, 70%, 50%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: "hsl(197, 80%, 50%, 0.5)",
    // Blue focus ring
    selection: "hsl(197, 94%, 67%, 0.2)",
    // Blue selection
    highlight: "hsl(348, 79%, 81%, 0.2)"
    // Pink highlight
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: "hsl(197, 94%, 67%)",
    // Trans Blue #5BCEFA
    achievement: "hsl(160, 80%, 45%)",
    streak: "hsl(348, 79%, 81%)",
    // Trans Pink #F5A9B8
    party: "hsl(348, 79%, 81%)"
    // Trans Pink #F5A9B8
  },
  // ==========================================================================
  // SHADOWS (Light Mode - pink glow)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    pop: "0 4px 0 0 hsl(348 60% 75% / 0.4)",
    // Pink pop shadow
    glow: "0 0 25px 3px hsl(348 79% 81% / 0.35)",
    // Trans pink glow
    bounce: "0 2px 0 0 hsl(348 60% 75% / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(348, 50%, 98%)",
    foreground: "hsl(260, 30%, 15%)",
    muted: "hsl(197, 50%, 95%)",
    mutedForeground: "hsl(260, 12%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(260, 20%, 35%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(260, 30%, 15%)",
    border: "hsl(197, 30%, 82%)",
    input: "hsl(197, 30%, 82%)",
    primary: "hsl(348, 70%, 65%)",
    // Pink primary
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(197, 50%, 95%)",
    // Blue secondary background
    secondaryForeground: "hsl(197, 80%, 40%)",
    // Blue text
    accent: "hsl(197, 55%, 92%)",
    // Blue accent background
    accentForeground: "hsl(197, 80%, 40%)",
    // Blue text
    destructive: "hsl(0, 70%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(197, 80%, 50%)",
    // Blue ring
    radius: "0.5rem"
  }
};

// src/design/themes/transcend-dark.ts
var transcendDark = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // ==========================================================================
  brand: {
    primary: "hsl(348, 79%, 81%)",
    // Trans pink #F5A9B8
    primaryHover: "hsl(348, 79%, 88%)",
    primaryActive: "hsl(348, 79%, 75%)",
    primarySubtle: "hsl(348, 50%, 20%)",
    secondary: "hsl(197, 94%, 67%)",
    // Trans blue #5BCEFA
    secondaryHover: "hsl(197, 94%, 75%)",
    accent: "hsl(197, 94%, 67%)",
    // Trans blue as accent
    accentHover: "hsl(197, 94%, 75%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purple with blue/pink tints)
  // ==========================================================================
  background: {
    page: "hsl(260, 25%, 10%)",
    // Deep purple-black
    surface: "hsl(260, 22%, 14%)",
    // Slightly lifted
    elevated: "hsl(260, 20%, 18%)",
    // Popovers, dropdowns
    sunken: "hsl(260, 30%, 7%)",
    overlay: "hsl(260, 25%, 6%, 0.9)",
    interactive: "hsl(197, 40%, 15%)",
    // Blue-tinted interactive
    interactiveHover: "hsl(197, 45%, 20%)",
    interactiveActive: "hsl(197, 50%, 25%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 40%, 14%)",
    warning: "hsl(38, 90%, 48%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 70%, 50%)",
    errorSubtle: "hsl(0, 45%, 14%)",
    info: "hsl(197, 94%, 50%)",
    // Trans blue
    infoSubtle: "hsl(197, 60%, 16%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - with blue accents)
  // ==========================================================================
  text: {
    primary: "hsl(197, 30%, 95%)",
    // Slight blue tint
    secondary: "hsl(197, 25%, 75%)",
    // Blue-tinted secondary
    tertiary: "hsl(260, 15%, 62%)",
    muted: "hsl(260, 15%, 55%)",
    disabled: "hsl(260, 10%, 40%)",
    heading: "hsl(197, 40%, 97%)",
    // Blue-tinted headings
    body: "hsl(197, 30%, 93%)",
    caption: "hsl(197, 25%, 70%)",
    onPrimary: "hsl(260, 30%, 15%)",
    // Dark text on pink
    onSurface: "hsl(197, 30%, 95%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(197, 94%, 72%)",
    // Bright blue links
    linkHover: "hsl(197, 94%, 80%)",
    success: "hsl(160, 70%, 55%)",
    warning: "hsl(38, 90%, 62%)",
    error: "hsl(0, 70%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode - blue accented)
  // ==========================================================================
  border: {
    default: "hsl(197, 30%, 25%)",
    // Blue-tinted borders
    strong: "hsl(197, 35%, 35%)",
    subtle: "hsl(260, 20%, 18%)",
    focus: "hsl(197, 94%, 67%)",
    // Trans blue focus
    error: "hsl(0, 70%, 50%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: "hsl(197, 94%, 67%, 0.6)",
    // Blue focus ring
    selection: "hsl(197, 94%, 67%, 0.3)",
    // Blue selection
    highlight: "hsl(348, 79%, 81%, 0.2)"
    // Pink highlight
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: "hsl(197, 94%, 67%)",
    // Trans Blue
    achievement: "hsl(160, 80%, 52%)",
    streak: "hsl(348, 79%, 81%)",
    // Trans Pink
    party: "hsl(348, 79%, 81%)"
    // Trans Pink
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - blue glow)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    pop: "0 4px 0 0 hsl(197 80% 40% / 0.5)",
    // Blue pop shadow
    glow: "0 0 30px 5px hsl(197 94% 67% / 0.4)",
    // Trans blue glow
    bounce: "0 2px 0 0 hsl(197 80% 40% / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(260, 25%, 10%)",
    foreground: "hsl(197, 30%, 95%)",
    muted: "hsl(197, 40%, 15%)",
    mutedForeground: "hsl(260, 15%, 55%)",
    popover: "hsl(260, 20%, 18%)",
    popoverForeground: "hsl(197, 25%, 75%)",
    card: "hsl(260, 22%, 14%)",
    cardForeground: "hsl(197, 30%, 95%)",
    border: "hsl(197, 30%, 25%)",
    input: "hsl(197, 30%, 25%)",
    primary: "hsl(348, 79%, 81%)",
    // Trans pink #F5A9B8
    primaryForeground: "hsl(260, 30%, 15%)",
    secondary: "hsl(197, 40%, 15%)",
    // Blue secondary background
    secondaryForeground: "hsl(197, 94%, 75%)",
    // Bright blue text
    accent: "hsl(197, 50%, 18%)",
    // Blue accent background
    accentForeground: "hsl(197, 94%, 75%)",
    // Bright blue text
    destructive: "hsl(0, 70%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(197, 94%, 67%)",
    // Trans blue ring
    radius: "0.5rem"
  }
};

// src/design/themes/sunset-light.ts
var sunsetLight = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: "hsl(15, 85%, 55%)",
    // Warm coral-orange
    primaryHover: "hsl(15, 85%, 48%)",
    primaryActive: "hsl(15, 85%, 42%)",
    primarySubtle: "hsl(15, 70%, 94%)",
    secondary: "hsl(340, 75%, 55%)",
    // Rose pink
    secondaryHover: "hsl(340, 75%, 48%)",
    accent: "hsl(45, 95%, 50%)",
    // Golden yellow
    accentHover: "hsl(45, 95%, 42%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - warm creams)
  // ==========================================================================
  background: {
    page: "hsl(30, 40%, 98%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(30, 35%, 94%)",
    overlay: "hsl(30, 30%, 20%, 0.5)",
    interactive: "hsl(30, 30%, 96%)",
    interactiveHover: "hsl(30, 30%, 92%)",
    interactiveActive: "hsl(30, 30%, 88%)",
    success: "hsl(145, 65%, 42%)",
    successSubtle: "hsl(145, 60%, 92%)",
    warning: "hsl(38, 95%, 50%)",
    warningSubtle: "hsl(38, 80%, 92%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 70%, 94%)",
    info: "hsl(200, 80%, 50%)",
    infoSubtle: "hsl(200, 70%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(20, 25%, 15%)",
    secondary: "hsl(20, 15%, 40%)",
    tertiary: "hsl(20, 12%, 50%)",
    muted: "hsl(20, 10%, 55%)",
    disabled: "hsl(20, 8%, 65%)",
    heading: "hsl(20, 30%, 12%)",
    body: "hsl(20, 25%, 18%)",
    caption: "hsl(20, 15%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(20, 25%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(15, 85%, 45%)",
    linkHover: "hsl(15, 85%, 35%)",
    success: "hsl(145, 70%, 32%)",
    warning: "hsl(30, 90%, 38%)",
    error: "hsl(0, 75%, 42%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: "hsl(30, 20%, 85%)",
    strong: "hsl(30, 20%, 75%)",
    subtle: "hsl(30, 25%, 92%)",
    focus: "hsl(15, 85%, 55%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 65%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(15, 85%, 55%, 0.4)",
    selection: "hsl(15, 85%, 55%, 0.15)",
    highlight: "hsl(45, 95%, 50%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 95%, 50%)",
    achievement: "hsl(145, 65%, 45%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(340, 75%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(20 30% 15% / 0.08), 0 1px 2px -1px hsl(20 30% 15% / 0.08)",
    floating: "0 4px 6px -1px hsl(20 30% 15% / 0.1), 0 2px 4px -2px hsl(20 30% 15% / 0.08)",
    overlay: "0 20px 25px -5px hsl(20 30% 15% / 0.12), 0 8px 10px -6px hsl(20 30% 15% / 0.08)",
    popup: "0 10px 15px -3px hsl(20 30% 15% / 0.1), 0 4px 6px -4px hsl(20 30% 15% / 0.08)",
    pop: "0 4px 0 0 hsl(20 30% 15% / 0.1)",
    glow: "0 0 15px 0 hsl(15 85% 55% / 0.25)",
    bounce: "0 2px 0 0 hsl(20 30% 15% / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(30, 40%, 98%)",
    foreground: "hsl(20, 25%, 15%)",
    muted: "hsl(30, 30%, 94%)",
    mutedForeground: "hsl(20, 10%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(20, 15%, 40%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(20, 25%, 15%)",
    border: "hsl(30, 20%, 85%)",
    input: "hsl(30, 20%, 85%)",
    primary: "hsl(15, 85%, 55%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(30, 30%, 94%)",
    secondaryForeground: "hsl(20, 25%, 15%)",
    accent: "hsl(15, 50%, 94%)",
    accentForeground: "hsl(15, 60%, 30%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(15, 85%, 55%)",
    radius: "0.5rem"
  }
};

// src/design/themes/sunset-dark.ts
var sunsetDark = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: "hsl(15, 85%, 58%)",
    // Warm coral-orange
    primaryHover: "hsl(15, 85%, 65%)",
    primaryActive: "hsl(15, 85%, 50%)",
    primarySubtle: "hsl(15, 45%, 16%)",
    secondary: "hsl(340, 75%, 62%)",
    // Rose pink
    secondaryHover: "hsl(340, 75%, 70%)",
    accent: "hsl(45, 95%, 55%)",
    // Golden yellow
    accentHover: "hsl(45, 95%, 62%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - warm browns/mahogany)
  // ==========================================================================
  background: {
    page: "hsl(15, 40%, 7%)",
    // Deep warm brown
    surface: "hsl(15, 35%, 11%)",
    elevated: "hsl(15, 30%, 15%)",
    sunken: "hsl(15, 45%, 5%)",
    overlay: "hsl(15, 40%, 4%, 0.85)",
    interactive: "hsl(15, 32%, 13%)",
    interactiveHover: "hsl(15, 28%, 19%)",
    interactiveActive: "hsl(15, 25%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(200, 85%, 52%)",
    infoSubtle: "hsl(200, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - warm whites)
  // ==========================================================================
  text: {
    primary: "hsl(30, 30%, 94%)",
    secondary: "hsl(30, 20%, 72%)",
    tertiary: "hsl(30, 15%, 60%)",
    muted: "hsl(30, 12%, 55%)",
    disabled: "hsl(30, 10%, 40%)",
    heading: "hsl(30, 35%, 97%)",
    body: "hsl(30, 30%, 92%)",
    caption: "hsl(30, 20%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(30, 30%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(15, 85%, 68%)",
    linkHover: "hsl(15, 85%, 76%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(15, 28%, 20%)",
    strong: "hsl(15, 25%, 28%)",
    subtle: "hsl(15, 32%, 14%)",
    focus: "hsl(15, 85%, 58%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(15, 85%, 58%, 0.5)",
    selection: "hsl(15, 85%, 58%, 0.25)",
    highlight: "hsl(45, 95%, 55%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 95%, 58%)",
    achievement: "hsl(145, 70%, 52%)",
    streak: "hsl(25, 100%, 58%)",
    party: "hsl(340, 75%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(15 85% 58% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(15, 40%, 7%)",
    foreground: "hsl(30, 30%, 94%)",
    muted: "hsl(15, 32%, 13%)",
    mutedForeground: "hsl(30, 12%, 55%)",
    popover: "hsl(15, 30%, 15%)",
    popoverForeground: "hsl(30, 20%, 72%)",
    card: "hsl(15, 35%, 11%)",
    cardForeground: "hsl(30, 30%, 94%)",
    border: "hsl(15, 28%, 20%)",
    input: "hsl(15, 28%, 20%)",
    primary: "hsl(15, 85%, 58%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(15, 32%, 13%)",
    secondaryForeground: "hsl(30, 30%, 94%)",
    accent: "hsl(15, 35%, 18%)",
    accentForeground: "hsl(15, 30%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(15, 85%, 58%)",
    radius: "0.5rem"
  }
};

// src/design/themes/forest-light.ts
var forestLight = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: "hsl(150, 55%, 38%)",
    // Forest green
    primaryHover: "hsl(150, 55%, 32%)",
    primaryActive: "hsl(150, 55%, 28%)",
    primarySubtle: "hsl(150, 45%, 92%)",
    secondary: "hsl(35, 80%, 45%)",
    // Warm amber
    secondaryHover: "hsl(35, 80%, 38%)",
    accent: "hsl(85, 50%, 45%)",
    // Lime green
    accentHover: "hsl(85, 50%, 38%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft creams with green tint)
  // ==========================================================================
  background: {
    page: "hsl(90, 20%, 97%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(90, 18%, 93%)",
    overlay: "hsl(150, 30%, 15%, 0.5)",
    interactive: "hsl(90, 15%, 95%)",
    interactiveHover: "hsl(90, 15%, 91%)",
    interactiveActive: "hsl(90, 15%, 87%)",
    success: "hsl(145, 65%, 42%)",
    successSubtle: "hsl(145, 55%, 92%)",
    warning: "hsl(38, 95%, 50%)",
    warningSubtle: "hsl(38, 80%, 92%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 65%, 94%)",
    info: "hsl(200, 80%, 50%)",
    infoSubtle: "hsl(200, 65%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(150, 25%, 15%)",
    secondary: "hsl(150, 12%, 40%)",
    tertiary: "hsl(150, 8%, 50%)",
    muted: "hsl(150, 6%, 55%)",
    disabled: "hsl(150, 5%, 65%)",
    heading: "hsl(150, 30%, 12%)",
    body: "hsl(150, 25%, 18%)",
    caption: "hsl(150, 12%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(150, 25%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(150, 55%, 32%)",
    linkHover: "hsl(150, 55%, 25%)",
    success: "hsl(145, 70%, 32%)",
    warning: "hsl(30, 90%, 38%)",
    error: "hsl(0, 75%, 42%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: "hsl(90, 12%, 82%)",
    strong: "hsl(90, 12%, 72%)",
    subtle: "hsl(90, 15%, 90%)",
    focus: "hsl(150, 55%, 38%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 65%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(150, 55%, 38%, 0.4)",
    selection: "hsl(150, 55%, 38%, 0.15)",
    highlight: "hsl(35, 80%, 45%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(35, 85%, 50%)",
    achievement: "hsl(150, 55%, 40%)",
    streak: "hsl(25, 95%, 55%)",
    party: "hsl(85, 50%, 48%)"
  },
  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(150 30% 15% / 0.08), 0 1px 2px -1px hsl(150 30% 15% / 0.08)",
    floating: "0 4px 6px -1px hsl(150 30% 15% / 0.1), 0 2px 4px -2px hsl(150 30% 15% / 0.08)",
    overlay: "0 20px 25px -5px hsl(150 30% 15% / 0.12), 0 8px 10px -6px hsl(150 30% 15% / 0.08)",
    popup: "0 10px 15px -3px hsl(150 30% 15% / 0.1), 0 4px 6px -4px hsl(150 30% 15% / 0.08)",
    pop: "0 4px 0 0 hsl(150 30% 15% / 0.1)",
    glow: "0 0 15px 0 hsl(150 55% 38% / 0.25)",
    bounce: "0 2px 0 0 hsl(150 30% 15% / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(90, 20%, 97%)",
    foreground: "hsl(150, 25%, 15%)",
    muted: "hsl(90, 15%, 93%)",
    mutedForeground: "hsl(150, 6%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(150, 12%, 40%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(150, 25%, 15%)",
    border: "hsl(90, 12%, 82%)",
    input: "hsl(90, 12%, 82%)",
    primary: "hsl(150, 55%, 38%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(90, 15%, 93%)",
    secondaryForeground: "hsl(150, 25%, 15%)",
    accent: "hsl(150, 40%, 92%)",
    accentForeground: "hsl(150, 50%, 25%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(150, 55%, 38%)",
    radius: "0.5rem"
  }
};

// src/design/themes/forest-dark.ts
var forestDark = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: "hsl(150, 55%, 45%)",
    // Forest green
    primaryHover: "hsl(150, 55%, 52%)",
    primaryActive: "hsl(150, 55%, 38%)",
    primarySubtle: "hsl(150, 35%, 15%)",
    secondary: "hsl(35, 80%, 52%)",
    // Warm amber
    secondaryHover: "hsl(35, 80%, 60%)",
    accent: "hsl(85, 55%, 52%)",
    // Lime green
    accentHover: "hsl(85, 55%, 60%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep forest greens)
  // ==========================================================================
  background: {
    page: "hsl(150, 35%, 7%)",
    // Deep forest green
    surface: "hsl(150, 30%, 11%)",
    elevated: "hsl(150, 25%, 15%)",
    sunken: "hsl(150, 40%, 5%)",
    overlay: "hsl(150, 35%, 4%, 0.85)",
    interactive: "hsl(150, 28%, 13%)",
    interactiveHover: "hsl(150, 24%, 19%)",
    interactiveActive: "hsl(150, 20%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(200, 85%, 52%)",
    infoSubtle: "hsl(200, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - warm whites with green tint)
  // ==========================================================================
  text: {
    primary: "hsl(90, 20%, 94%)",
    secondary: "hsl(90, 15%, 72%)",
    tertiary: "hsl(90, 10%, 60%)",
    muted: "hsl(90, 8%, 55%)",
    disabled: "hsl(90, 6%, 40%)",
    heading: "hsl(90, 25%, 97%)",
    body: "hsl(90, 20%, 92%)",
    caption: "hsl(90, 15%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(90, 20%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(150, 55%, 55%)",
    linkHover: "hsl(150, 55%, 65%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(150, 25%, 20%)",
    strong: "hsl(150, 22%, 28%)",
    subtle: "hsl(150, 28%, 14%)",
    focus: "hsl(150, 55%, 45%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(150, 55%, 45%, 0.5)",
    selection: "hsl(150, 55%, 45%, 0.25)",
    highlight: "hsl(35, 80%, 52%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(35, 85%, 55%)",
    achievement: "hsl(150, 55%, 48%)",
    streak: "hsl(25, 95%, 58%)",
    party: "hsl(85, 55%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(150 55% 45% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(150, 35%, 7%)",
    foreground: "hsl(90, 20%, 94%)",
    muted: "hsl(150, 28%, 13%)",
    mutedForeground: "hsl(90, 8%, 55%)",
    popover: "hsl(150, 25%, 15%)",
    popoverForeground: "hsl(90, 15%, 72%)",
    card: "hsl(150, 30%, 11%)",
    cardForeground: "hsl(90, 20%, 94%)",
    border: "hsl(150, 25%, 20%)",
    input: "hsl(150, 25%, 20%)",
    primary: "hsl(150, 55%, 45%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(150, 28%, 13%)",
    secondaryForeground: "hsl(90, 20%, 94%)",
    accent: "hsl(150, 30%, 18%)",
    accentForeground: "hsl(150, 30%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(150, 55%, 45%)",
    radius: "0.5rem"
  }
};

// src/design/themes/synthwave-dark.ts
var synthwaveDark = {
  // ==========================================================================
  // BRAND COLORS - Neon retro colors
  // ==========================================================================
  brand: {
    primary: "hsl(320, 95%, 60%)",
    // Hot pink
    primaryHover: "hsl(320, 95%, 68%)",
    primaryActive: "hsl(320, 95%, 52%)",
    primarySubtle: "hsl(320, 50%, 18%)",
    secondary: "hsl(180, 100%, 50%)",
    // Electric cyan
    secondaryHover: "hsl(180, 100%, 58%)",
    accent: "hsl(270, 90%, 65%)",
    // Neon purple
    accentHover: "hsl(270, 90%, 72%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purples)
  // ==========================================================================
  background: {
    page: "hsl(260, 50%, 6%)",
    // Deep purple-black
    surface: "hsl(260, 45%, 10%)",
    elevated: "hsl(260, 40%, 14%)",
    sunken: "hsl(260, 55%, 4%)",
    overlay: "hsl(260, 50%, 3%, 0.9)",
    interactive: "hsl(260, 42%, 12%)",
    interactiveHover: "hsl(260, 38%, 18%)",
    interactiveActive: "hsl(260, 35%, 22%)",
    success: "hsl(160, 80%, 40%)",
    successSubtle: "hsl(160, 45%, 14%)",
    warning: "hsl(45, 100%, 50%)",
    warningSubtle: "hsl(45, 50%, 14%)",
    error: "hsl(0, 75%, 52%)",
    errorSubtle: "hsl(0, 45%, 14%)",
    info: "hsl(180, 100%, 45%)",
    infoSubtle: "hsl(180, 50%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - bright whites with cyan tint)
  // ==========================================================================
  text: {
    primary: "hsl(180, 20%, 94%)",
    secondary: "hsl(180, 15%, 72%)",
    tertiary: "hsl(180, 10%, 60%)",
    muted: "hsl(260, 12%, 55%)",
    disabled: "hsl(260, 10%, 40%)",
    heading: "hsl(180, 25%, 98%)",
    body: "hsl(180, 20%, 92%)",
    caption: "hsl(180, 15%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(180, 20%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(320, 95%, 70%)",
    linkHover: "hsl(320, 95%, 80%)",
    success: "hsl(160, 80%, 55%)",
    warning: "hsl(45, 100%, 60%)",
    error: "hsl(0, 75%, 65%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(260, 35%, 22%)",
    strong: "hsl(260, 32%, 30%)",
    subtle: "hsl(260, 40%, 14%)",
    focus: "hsl(320, 95%, 60%)",
    error: "hsl(0, 75%, 52%)",
    success: "hsl(160, 80%, 40%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(320, 95%, 60%, 0.5)",
    selection: "hsl(270, 90%, 65%, 0.25)",
    highlight: "hsl(180, 100%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - extra vibrant)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 55%)",
    achievement: "hsl(160, 80%, 50%)",
    streak: "hsl(25, 100%, 58%)",
    party: "hsl(320, 95%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - with glow effects)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.5)",
    glow: "0 0 30px 5px hsl(320 95% 60% / 0.4)",
    // Extra glowy
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(260, 50%, 6%)",
    foreground: "hsl(180, 20%, 94%)",
    muted: "hsl(260, 42%, 12%)",
    mutedForeground: "hsl(260, 12%, 55%)",
    popover: "hsl(260, 40%, 14%)",
    popoverForeground: "hsl(180, 15%, 72%)",
    card: "hsl(260, 45%, 10%)",
    cardForeground: "hsl(180, 20%, 94%)",
    border: "hsl(260, 35%, 22%)",
    input: "hsl(260, 35%, 22%)",
    primary: "hsl(320, 95%, 60%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(260, 42%, 12%)",
    secondaryForeground: "hsl(180, 20%, 94%)",
    accent: "hsl(270, 45%, 20%)",
    accentForeground: "hsl(270, 50%, 92%)",
    destructive: "hsl(0, 75%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(320, 95%, 60%)",
    radius: "0.5rem"
  }
};

// src/design/themes/index.ts
var groupiLightTheme = {
  id: "groupi-light",
  name: "Groupi Light",
  description: "The default purple-focused light theme",
  mode: "light",
  preview: {
    primary: groupiLight.brand.primary,
    background: groupiLight.background.page,
    accent: groupiLight.brand.accent
  },
  tokens: groupiLight
};
var groupiDarkTheme = {
  id: "groupi-dark",
  name: "Groupi Dark",
  description: "The default purple-focused dark theme",
  mode: "dark",
  preview: {
    primary: groupiDark.brand.primary,
    background: groupiDark.background.page,
    accent: groupiDark.brand.accent
  },
  tokens: groupiDark
};
var oledDarkTheme = {
  id: "oled-dark",
  name: "OLED Dark",
  description: "True black theme optimized for OLED screens",
  mode: "dark",
  preview: {
    primary: oledDark.brand.primary,
    background: oledDark.background.page,
    accent: oledDark.brand.accent
  },
  tokens: oledDark
};
var oceanLightTheme = {
  id: "ocean-light",
  name: "Ocean Light",
  description: "A calm, blue-focused light theme",
  mode: "light",
  preview: {
    primary: oceanLight.brand.primary,
    background: oceanLight.background.page,
    accent: oceanLight.brand.accent
  },
  tokens: oceanLight
};
var oceanDarkTheme = {
  id: "ocean-dark",
  name: "Ocean Dark",
  description: "A calm, blue-focused dark theme",
  mode: "dark",
  preview: {
    primary: oceanDark.brand.primary,
    background: oceanDark.background.page,
    accent: oceanDark.brand.accent
  },
  tokens: oceanDark
};
var transcendLightTheme = {
  id: "transcend-light",
  name: "Transcend Light",
  description: "Trans pride inspired with vibrant pinks and blues",
  mode: "light",
  preview: {
    primary: transcendLight.brand.primary,
    background: transcendLight.background.page,
    accent: transcendLight.brand.accent
  },
  tokens: transcendLight
};
var transcendDarkTheme = {
  id: "transcend-dark",
  name: "Transcend Dark",
  description: "Trans pride inspired with vibrant pinks and blues",
  mode: "dark",
  preview: {
    primary: transcendDark.brand.primary,
    background: transcendDark.background.page,
    accent: transcendDark.brand.accent
  },
  tokens: transcendDark
};
var sunsetLightTheme = {
  id: "sunset-light",
  name: "Sunset Light",
  description: "Warm coral and orange inspired by golden hour",
  mode: "light",
  preview: {
    primary: sunsetLight.brand.primary,
    background: sunsetLight.background.page,
    accent: sunsetLight.brand.accent
  },
  tokens: sunsetLight
};
var sunsetDarkTheme = {
  id: "sunset-dark",
  name: "Sunset Dark",
  description: "Warm coral and orange on deep mahogany",
  mode: "dark",
  preview: {
    primary: sunsetDark.brand.primary,
    background: sunsetDark.background.page,
    accent: sunsetDark.brand.accent
  },
  tokens: sunsetDark
};
var forestLightTheme = {
  id: "forest-light",
  name: "Forest Light",
  description: "Earthy greens and warm ambers",
  mode: "light",
  preview: {
    primary: forestLight.brand.primary,
    background: forestLight.background.page,
    accent: forestLight.brand.accent
  },
  tokens: forestLight
};
var forestDarkTheme = {
  id: "forest-dark",
  name: "Forest Dark",
  description: "Deep forest greens with amber glow",
  mode: "dark",
  preview: {
    primary: forestDark.brand.primary,
    background: forestDark.background.page,
    accent: forestDark.brand.accent
  },
  tokens: forestDark
};
var synthwaveDarkTheme = {
  id: "synthwave-dark",
  name: "Synthwave",
  description: "80s retro with hot pink and electric cyan",
  mode: "dark",
  preview: {
    primary: synthwaveDark.brand.primary,
    background: synthwaveDark.background.page,
    accent: synthwaveDark.brand.accent
  },
  tokens: synthwaveDark
};
var baseThemeRegistry = {
  "groupi-light": groupiLightTheme,
  "groupi-dark": groupiDarkTheme,
  "oled-dark": oledDarkTheme,
  "ocean-light": oceanLightTheme,
  "ocean-dark": oceanDarkTheme,
  "transcend-light": transcendLightTheme,
  "transcend-dark": transcendDarkTheme,
  "sunset-light": sunsetLightTheme,
  "sunset-dark": sunsetDarkTheme,
  "forest-light": forestLightTheme,
  "forest-dark": forestDarkTheme,
  "synthwave-dark": synthwaveDarkTheme
};
var baseThemes = Object.values(baseThemeRegistry);
var lightThemes = baseThemes.filter(
  (theme) => theme.mode === "light"
);
var darkThemes = baseThemes.filter(
  (theme) => theme.mode === "dark"
);
var DEFAULT_LIGHT_THEME_ID = "groupi-light";
var DEFAULT_DARK_THEME_ID = "groupi-dark";
function getBaseTheme(id) {
  return baseThemeRegistry[id];
}
function getPairedTheme(id) {
  const theme = baseThemeRegistry[id];
  if (!theme) return void 0;
  const family = id.replace(/-light$|-dark$/, "");
  const pairedMode = theme.mode === "light" ? "dark" : "light";
  const pairedId = `${family}-${pairedMode}`;
  return baseThemeRegistry[pairedId];
}
var themes = {
  light: groupiLight,
  dark: groupiDark
};
var tokens = sharedTokens;
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export { DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, animations, announceToScreenReader, baseThemeRegistry, baseThemes, borderRadius, breakpoints, calculateContrastRatio, calculateKeyboardAvoidingOffset, capitalizeFirst, cn, colors, components, createAsyncState, createAuthHooks, createButtonA11yProps, createDialogA11yProps, createErrorMessage, createEventActionHooks, createEventDataHooks, createEventHooks, createFormA11yProps, createFormField, createHeadingA11yProps, createImageA11yProps, createListA11yProps, createListItemA11yProps, createPostActionHooks, createPostDataHooks, createStatusA11yProps, createTabA11yProps, createTextInputA11yProps, createValidator, darkThemes, debounce, dismissKeyboard, forestDark, forestDarkTheme, forestLight, forestLightTheme, formatDate, formatDateTime, formatDateTimeRange, formatDateTimeRangeShort, formatTime, generateInitials, getBaseTheme, getDeviceInfo, getFocusManager, getKeyboardHeight, getKeyboardOptions, getKeyboardState, getLayoutInfo, getNavigationAdapter, getPairedTheme, getPlatform, getResponsiveFontSize, getResponsiveSize, getResponsiveSpacing, getSafeAreaInsets, getScaledFontSize, getStorageAdapter, getToastAdapter, groupBy, groupiDark, groupiDarkTheme, groupiLight, groupiLightTheme, isEventPast, isKeyboardVisible, isLandscape, isLargeScreen, isLargeTextScale, isMobile, isPortrait, isSameDay, isScreenReaderEnabled, isSmallScreen, isValidDate, isWeb, lightThemes, meetsContrastRequirement, navigation, oceanDark, oceanDarkTheme, oceanLight, oceanLightTheme, oledDark, oledDarkTheme, primitives, retry, sanitizeInput, semantic, serializeError, setDeviceInfo, setDismissKeyboardFunction, setError, setFocusManager, setKeyboardOptions, setKeyboardState, setLayoutInfo, setLoading, setNavigationAdapter, setSafeAreaInsets, setScreenReaderManager, setStorageAdapter, setSuccess, setToastAdapter, shadows, sharedTokens, sortBy, spacing, storage, subscribeToKeyboard, subscribeToKeyboardEvents, sunsetDark, sunsetDarkTheme, sunsetLight, sunsetLightTheme, synthwaveDark, synthwaveDarkTheme, themes, toast, tokens, transcendDark, transcendDarkTheme, transcendLight, transcendLightTheme, triggerKeyboardEvent, truncateText, typography, uniqueBy, useNavigation, useStorage, useToast, validateEmail, validateForm, validateMaxLength, validateMinLength, validateRequired, wouldBeHiddenByKeyboard };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map