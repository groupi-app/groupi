'use strict';

var react = require('convex/react');
var react$1 = require('react');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');

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
var colors = {
  // Core colors that map to CSS custom properties
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
var spacing = {
  0: "0",
  1: "0.25rem",
  // 4px
  2: "0.5rem",
  // 8px
  3: "0.75rem",
  // 12px
  4: "1rem",
  // 16px
  5: "1.25rem",
  // 20px
  6: "1.5rem",
  // 24px
  8: "2rem",
  // 32px
  10: "2.5rem",
  // 40px
  12: "3rem",
  // 48px
  16: "4rem",
  // 64px
  20: "5rem",
  // 80px
  24: "6rem"
  // 96px
};
var typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["Fira Code", "Monaco", "monospace"]
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    // 14px
    base: ["1rem", { lineHeight: "1.5rem" }],
    // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    // 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }]
    // 36px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  }
};
var borderRadius = {
  none: "0",
  sm: "0.125rem",
  // 2px
  DEFAULT: "0.25rem",
  // 4px
  md: "0.375rem",
  // 6px
  lg: "0.5rem",
  // 8px
  xl: "0.75rem",
  // 12px
  "2xl": "1rem",
  // 16px
  full: "9999px"
};
var shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
};
var animations = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms"
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)"
  }
};
var breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};
function cn(...inputs) {
  return tailwindMerge.twMerge(clsx.clsx(inputs));
}

exports.animations = animations;
exports.announceToScreenReader = announceToScreenReader;
exports.borderRadius = borderRadius;
exports.breakpoints = breakpoints;
exports.calculateContrastRatio = calculateContrastRatio;
exports.calculateKeyboardAvoidingOffset = calculateKeyboardAvoidingOffset;
exports.capitalizeFirst = capitalizeFirst;
exports.cn = cn;
exports.colors = colors;
exports.createAsyncState = createAsyncState;
exports.createAuthHooks = createAuthHooks;
exports.createButtonA11yProps = createButtonA11yProps;
exports.createDialogA11yProps = createDialogA11yProps;
exports.createErrorMessage = createErrorMessage;
exports.createEventActionHooks = createEventActionHooks;
exports.createEventDataHooks = createEventDataHooks;
exports.createEventHooks = createEventHooks;
exports.createFormA11yProps = createFormA11yProps;
exports.createFormField = createFormField;
exports.createHeadingA11yProps = createHeadingA11yProps;
exports.createImageA11yProps = createImageA11yProps;
exports.createListA11yProps = createListA11yProps;
exports.createListItemA11yProps = createListItemA11yProps;
exports.createPostActionHooks = createPostActionHooks;
exports.createPostDataHooks = createPostDataHooks;
exports.createStatusA11yProps = createStatusA11yProps;
exports.createTabA11yProps = createTabA11yProps;
exports.createTextInputA11yProps = createTextInputA11yProps;
exports.createValidator = createValidator;
exports.debounce = debounce;
exports.dismissKeyboard = dismissKeyboard;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.formatDateTimeRange = formatDateTimeRange;
exports.formatDateTimeRangeShort = formatDateTimeRangeShort;
exports.formatTime = formatTime;
exports.generateInitials = generateInitials;
exports.getDeviceInfo = getDeviceInfo;
exports.getFocusManager = getFocusManager;
exports.getKeyboardHeight = getKeyboardHeight;
exports.getKeyboardOptions = getKeyboardOptions;
exports.getKeyboardState = getKeyboardState;
exports.getLayoutInfo = getLayoutInfo;
exports.getNavigationAdapter = getNavigationAdapter;
exports.getPlatform = getPlatform;
exports.getResponsiveFontSize = getResponsiveFontSize;
exports.getResponsiveSize = getResponsiveSize;
exports.getResponsiveSpacing = getResponsiveSpacing;
exports.getSafeAreaInsets = getSafeAreaInsets;
exports.getScaledFontSize = getScaledFontSize;
exports.getStorageAdapter = getStorageAdapter;
exports.getToastAdapter = getToastAdapter;
exports.groupBy = groupBy;
exports.isEventPast = isEventPast;
exports.isKeyboardVisible = isKeyboardVisible;
exports.isLandscape = isLandscape;
exports.isLargeScreen = isLargeScreen;
exports.isLargeTextScale = isLargeTextScale;
exports.isMobile = isMobile;
exports.isPortrait = isPortrait;
exports.isSameDay = isSameDay;
exports.isScreenReaderEnabled = isScreenReaderEnabled;
exports.isSmallScreen = isSmallScreen;
exports.isValidDate = isValidDate;
exports.isWeb = isWeb;
exports.meetsContrastRequirement = meetsContrastRequirement;
exports.navigation = navigation;
exports.retry = retry;
exports.sanitizeInput = sanitizeInput;
exports.serializeError = serializeError;
exports.setDeviceInfo = setDeviceInfo;
exports.setDismissKeyboardFunction = setDismissKeyboardFunction;
exports.setError = setError;
exports.setFocusManager = setFocusManager;
exports.setKeyboardOptions = setKeyboardOptions;
exports.setKeyboardState = setKeyboardState;
exports.setLayoutInfo = setLayoutInfo;
exports.setLoading = setLoading;
exports.setNavigationAdapter = setNavigationAdapter;
exports.setSafeAreaInsets = setSafeAreaInsets;
exports.setScreenReaderManager = setScreenReaderManager;
exports.setStorageAdapter = setStorageAdapter;
exports.setSuccess = setSuccess;
exports.setToastAdapter = setToastAdapter;
exports.shadows = shadows;
exports.sortBy = sortBy;
exports.spacing = spacing;
exports.storage = storage;
exports.subscribeToKeyboard = subscribeToKeyboard;
exports.subscribeToKeyboardEvents = subscribeToKeyboardEvents;
exports.toast = toast;
exports.triggerKeyboardEvent = triggerKeyboardEvent;
exports.truncateText = truncateText;
exports.typography = typography;
exports.uniqueBy = uniqueBy;
exports.useNavigation = useNavigation;
exports.useStorage = useStorage;
exports.useToast = useToast;
exports.validateEmail = validateEmail;
exports.validateForm = validateForm;
exports.validateMaxLength = validateMaxLength;
exports.validateMinLength = validateMinLength;
exports.validateRequired = validateRequired;
exports.wouldBeHiddenByKeyboard = wouldBeHiddenByKeyboard;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map