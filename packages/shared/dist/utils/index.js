'use strict';

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

exports.announceToScreenReader = announceToScreenReader;
exports.calculateContrastRatio = calculateContrastRatio;
exports.calculateKeyboardAvoidingOffset = calculateKeyboardAvoidingOffset;
exports.capitalizeFirst = capitalizeFirst;
exports.createAsyncState = createAsyncState;
exports.createButtonA11yProps = createButtonA11yProps;
exports.createDialogA11yProps = createDialogA11yProps;
exports.createErrorMessage = createErrorMessage;
exports.createFormA11yProps = createFormA11yProps;
exports.createFormField = createFormField;
exports.createHeadingA11yProps = createHeadingA11yProps;
exports.createImageA11yProps = createImageA11yProps;
exports.createListA11yProps = createListA11yProps;
exports.createListItemA11yProps = createListItemA11yProps;
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
exports.getPlatform = getPlatform;
exports.getResponsiveFontSize = getResponsiveFontSize;
exports.getResponsiveSize = getResponsiveSize;
exports.getResponsiveSpacing = getResponsiveSpacing;
exports.getSafeAreaInsets = getSafeAreaInsets;
exports.getScaledFontSize = getScaledFontSize;
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
exports.setSafeAreaInsets = setSafeAreaInsets;
exports.setScreenReaderManager = setScreenReaderManager;
exports.setSuccess = setSuccess;
exports.sortBy = sortBy;
exports.subscribeToKeyboard = subscribeToKeyboard;
exports.subscribeToKeyboardEvents = subscribeToKeyboardEvents;
exports.triggerKeyboardEvent = triggerKeyboardEvent;
exports.truncateText = truncateText;
exports.uniqueBy = uniqueBy;
exports.validateEmail = validateEmail;
exports.validateForm = validateForm;
exports.validateMaxLength = validateMaxLength;
exports.validateMinLength = validateMinLength;
exports.validateRequired = validateRequired;
exports.wouldBeHiddenByKeyboard = wouldBeHiddenByKeyboard;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map