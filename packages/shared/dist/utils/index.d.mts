import { DeviceInfo, LayoutInfo, FormField, ValidationResult, AsyncState } from '../types/index.mjs';
import '../types-DwU5YVHx.mjs';

/**
 * Device and platform-specific utilities
 * Works across web and React Native
 */

/**
 * Set device info - called during app initialization
 */
declare function setDeviceInfo(info: DeviceInfo): void;
/**
 * Get current device info
 */
declare function getDeviceInfo(): DeviceInfo;
/**
 * Set current layout info - called when layout changes
 */
declare function setLayoutInfo(layout: LayoutInfo): void;
/**
 * Get current layout info
 */
declare function getLayoutInfo(): LayoutInfo | null;
/**
 * Check if device is in landscape mode
 */
declare function isLandscape(): boolean;
/**
 * Check if device is in portrait mode
 */
declare function isPortrait(): boolean;
/**
 * Check if screen is considered small (useful for responsive design)
 */
declare function isSmallScreen(): boolean;
/**
 * Check if screen is considered large
 */
declare function isLargeScreen(): boolean;
/**
 * Get safe area insets (for notched devices)
 * This will need to be implemented platform-specifically
 */
interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
declare function setSafeAreaInsets(insets: SafeAreaInsets): void;
declare function getSafeAreaInsets(): SafeAreaInsets;
/**
 * Calculate responsive size based on screen width
 */
declare function getResponsiveSize(baseSize: number, screenWidth?: number): number;
/**
 * Get responsive font size
 */
declare function getResponsiveFontSize(baseFontSize: number): number;
/**
 * Get responsive spacing
 */
declare function getResponsiveSpacing(baseSpacing: number): number;

/**
 * Keyboard handling utilities
 * Abstracts keyboard behavior across web and React Native
 */
interface KeyboardState {
    isVisible: boolean;
    height: number;
}
/**
 * Set keyboard state - called by platform adapters
 */
declare function setKeyboardState(state: KeyboardState): void;
/**
 * Get current keyboard state
 */
declare function getKeyboardState(): KeyboardState;
/**
 * Subscribe to keyboard state changes
 */
declare function subscribeToKeyboard(callback: (state: KeyboardState) => void): () => void;
/**
 * Check if keyboard is currently visible
 */
declare function isKeyboardVisible(): boolean;
/**
 * Get current keyboard height
 */
declare function getKeyboardHeight(): number;
/**
 * Keyboard behavior utilities
 */
interface KeyboardOptions {
    dismissOnTap?: boolean;
    adjustResize?: boolean;
    androidSoftInputMode?: 'adjustResize' | 'adjustPan' | 'adjustNothing';
}
/**
 * Set keyboard behavior options
 */
declare function setKeyboardOptions(options: KeyboardOptions): void;
/**
 * Get current keyboard options
 */
declare function getKeyboardOptions(): KeyboardOptions;
/**
 * Dismiss keyboard programmatically
 * Implementation will be platform-specific
 */
type DismissKeyboardFn = () => void;
declare function setDismissKeyboardFunction(fn: DismissKeyboardFn): void;
declare function dismissKeyboard(): void;
/**
 * Calculate content offset to avoid keyboard
 * Useful for forms and input fields
 */
declare function calculateKeyboardAvoidingOffset(inputY: number, inputHeight: number, screenHeight: number, additionalPadding?: number): number;
/**
 * Check if an input field would be hidden by keyboard
 */
declare function wouldBeHiddenByKeyboard(inputY: number, inputHeight: number, screenHeight: number): boolean;
/**
 * Common keyboard event types
 */
interface KeyboardEvent {
    type: 'show' | 'hide';
    height: number;
    duration?: number;
}
type KeyboardEventListener = (event: KeyboardEvent) => void;
/**
 * Subscribe to keyboard show/hide events
 */
declare function subscribeToKeyboardEvents(listener: KeyboardEventListener): () => void;
/**
 * Trigger keyboard event - called by platform adapters
 */
declare function triggerKeyboardEvent(event: KeyboardEvent): void;

/**
 * Accessibility utilities for cross-platform development
 * Ensures consistent a11y patterns across web and React Native
 */
/**
 * Common accessibility roles that work across platforms
 * Note: Using only roles that are valid in React Native's AccessibilityRole type
 * React Native valid roles: 'none' | 'button' | 'link' | 'search' | 'image' | 'text' |
 * 'adjustable' | 'header' | 'summary' | 'checkbox' | 'combobox' | 'menu' | 'menubar' |
 * 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' |
 * 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar' | 'list' | 'listitem' | 'grid'
 */
type AccessibilityRole = 'none' | 'button' | 'link' | 'text' | 'header' | 'list' | 'listitem' | 'search' | 'image' | 'tab' | 'tablist' | 'adjustable' | 'summary' | 'alert' | 'menu' | 'menubar' | 'menuitem' | 'checkbox' | 'radio' | 'radiogroup' | 'switch' | 'progressbar' | 'scrollbar' | 'spinbutton' | 'timer' | 'toolbar' | 'combobox' | 'grid';
/**
 * Accessibility state properties
 */
interface AccessibilityState {
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    expanded?: boolean;
    busy?: boolean;
}
/**
 * Common accessibility props that work across platforms
 * Uses Record type to allow spreading into any React Native component
 * without type conflicts (React Native's AccessibilityRole varies by version)
 */
type AccessibilityProps = Record<string, unknown>;
/**
 * Create accessible button props
 */
declare function createButtonA11yProps(label: string, options?: {
    hint?: string;
    disabled?: boolean;
    selected?: boolean;
    testID?: string;
}): AccessibilityProps;
/**
 * Create accessible text input props
 * Note: React Native doesn't have a 'textinput' role, using 'none' instead
 * The TextInput component is inherently accessible
 */
declare function createTextInputA11yProps(label: string, options?: {
    hint?: string;
    required?: boolean;
    invalid?: boolean;
    testID?: string;
}): AccessibilityProps;
/**
 * Create accessible heading props
 */
declare function createHeadingA11yProps(text: string, level?: 1 | 2 | 3 | 4 | 5 | 6): AccessibilityProps;
/**
 * Create accessible list props
 */
declare function createListA11yProps(itemCount: number, label?: string): AccessibilityProps;
/**
 * Create accessible list item props
 */
declare function createListItemA11yProps(label: string, index?: number, total?: number): AccessibilityProps;
/**
 * Create accessible image props
 */
declare function createImageA11yProps(alt: string, decorative?: boolean): AccessibilityProps;
/**
 * Create accessible status/alert props
 * Note: React Native only has 'alert' role, not 'status'. Using 'alert' for all.
 */
declare function createStatusA11yProps(message: string, type?: 'info' | 'success' | 'warning' | 'error'): AccessibilityProps;
/**
 * Create accessible dialog props
 * Note: React Native doesn't have 'dialog' role, using 'none' instead
 */
declare function createDialogA11yProps(title: string, description?: string): AccessibilityProps;
/**
 * Create accessible tab props
 */
declare function createTabA11yProps(label: string, selected: boolean, index: number, total: number): AccessibilityProps;
/**
 * Create accessible form props
 * Note: React Native doesn't have 'form' role, using 'none' instead
 */
declare function createFormA11yProps(title: string, description?: string): AccessibilityProps;
/**
 * Focus management utilities
 */
interface FocusManager {
    focus(element: unknown): void;
    blur(): void;
    moveFocusToNext(): void;
    moveFocusToPrevious(): void;
}
declare function setFocusManager(manager: FocusManager): void;
declare function getFocusManager(): FocusManager | null;
/**
 * Screen reader utilities
 */
type AnnouncementType = 'polite' | 'assertive';
interface ScreenReaderManager {
    announce(message: string, type?: AnnouncementType): void;
    isScreenReaderEnabled(): boolean;
}
declare function setScreenReaderManager(manager: ScreenReaderManager): void;
declare function announceToScreenReader(message: string, type?: AnnouncementType): void;
declare function isScreenReaderEnabled(): boolean;
/**
 * Color contrast utilities
 */
declare function calculateContrastRatio(_color1: string, _color2: string): number;
declare function meetsContrastRequirement(foreground: string, background: string, level?: 'AA' | 'AAA'): boolean;
/**
 * Text scaling utilities
 */
declare function getScaledFontSize(baseFontSize: number, textScale?: number): number;
declare function isLargeTextScale(textScale: number): boolean;

/**
 * Cross-platform utility functions for Groupi
 * These utilities work identically on web and mobile platforms
 */

declare function formatDate(date: Date | number): string;
declare function formatTime(date: Date | number): string;
declare function formatDateTime(date: Date | number): string;
/**
 * Check if two dates are on the same calendar day
 */
declare function isSameDay(date1: Date | number, date2: Date | number): boolean;
/**
 * Format a date range for display
 * Same day: "Monday, January 16, 2026, 8:00 PM - 9:00 PM"
 * Different day: "Monday, January 16, 2026, 8:00 PM - Tuesday, January 17, 2026, 9:00 AM"
 * No end date: Falls back to just the start date/time
 */
declare function formatDateTimeRange(startDate: Date | number, endDate?: Date | number | null): string;
/**
 * Format a shorter date range for card displays
 * Same day: "Mon, Jan 16, 8:00 PM - 9:00 PM"
 * Different day: "Mon, Jan 16, 8:00 PM - Tue, Jan 17, 9:00 AM"
 */
declare function formatDateTimeRangeShort(startDate: Date | number, endDate?: Date | number | null): string;
/**
 * Check if an event is in the past
 * Past = end time is in the past OR (no end time AND start date is yesterday or before)
 */
declare function isEventPast(startDateTime: number | null | undefined, endDateTime?: number | null | undefined): boolean;
declare function isValidDate(date: unknown): date is Date;
declare function truncateText(text: string, maxLength: number, suffix?: string): string;
declare function capitalizeFirst(text: string): string;
declare function generateInitials(firstName: string, lastName: string): string;
declare function sanitizeInput(input: string): string;
declare function validateEmail(email: string): boolean;
declare function validateRequired(value: string): boolean;
declare function validateMinLength(value: string, minLength: number): boolean;
declare function validateMaxLength(value: string, maxLength: number): boolean;
declare function createValidator(rules: Array<(value: string) => string | null>): (value: string) => string | null;
declare function createFormField(value?: string): FormField;
declare function validateForm(fields: Record<string, FormField>, validators: Record<string, (value: string) => string | null>): ValidationResult;
declare function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]>;
declare function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[];
declare function sortBy<T>(array: T[], keyFn: (item: T) => string | number): T[];
declare function createAsyncState<T>(data?: T): AsyncState<T>;
declare function setLoading<T>(state: AsyncState<T>): AsyncState<T>;
declare function setSuccess<T>(_state: AsyncState<T>, data: T): AsyncState<T>;
declare function setError<T>(state: AsyncState<T>, error: string): AsyncState<T>;
declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T & {
    cancel: () => void;
    flush: () => void;
};
declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, delay?: number): Promise<T>;
declare function getPlatform(): 'web' | 'mobile';
declare function isWeb(): boolean;
declare function isMobile(): boolean;
declare function serializeError(error: unknown): string;
declare function createErrorMessage(operation: string, error: unknown): string;

export { type AccessibilityProps, type AccessibilityRole, type AccessibilityState, type AnnouncementType, type DismissKeyboardFn, type FocusManager, type KeyboardEvent, type KeyboardEventListener, type KeyboardOptions, type KeyboardState, type SafeAreaInsets, type ScreenReaderManager, announceToScreenReader, calculateContrastRatio, calculateKeyboardAvoidingOffset, capitalizeFirst, createAsyncState, createButtonA11yProps, createDialogA11yProps, createErrorMessage, createFormA11yProps, createFormField, createHeadingA11yProps, createImageA11yProps, createListA11yProps, createListItemA11yProps, createStatusA11yProps, createTabA11yProps, createTextInputA11yProps, createValidator, debounce, dismissKeyboard, formatDate, formatDateTime, formatDateTimeRange, formatDateTimeRangeShort, formatTime, generateInitials, getDeviceInfo, getFocusManager, getKeyboardHeight, getKeyboardOptions, getKeyboardState, getLayoutInfo, getPlatform, getResponsiveFontSize, getResponsiveSize, getResponsiveSpacing, getSafeAreaInsets, getScaledFontSize, groupBy, isEventPast, isKeyboardVisible, isLandscape, isLargeScreen, isLargeTextScale, isMobile, isPortrait, isSameDay, isScreenReaderEnabled, isSmallScreen, isValidDate, isWeb, meetsContrastRequirement, retry, sanitizeInput, serializeError, setDeviceInfo, setDismissKeyboardFunction, setError, setFocusManager, setKeyboardOptions, setKeyboardState, setLayoutInfo, setLoading, setSafeAreaInsets, setScreenReaderManager, setSuccess, sortBy, subscribeToKeyboard, subscribeToKeyboardEvents, triggerKeyboardEvent, truncateText, uniqueBy, validateEmail, validateForm, validateMaxLength, validateMinLength, validateRequired, wouldBeHiddenByKeyboard };
