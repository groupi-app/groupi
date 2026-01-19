/**
 * Keyboard handling utilities
 * Abstracts keyboard behavior across web and React Native
 */

export interface KeyboardState {
  isVisible: boolean;
  height: number;
}

// Keyboard state management
let keyboardState: KeyboardState = { isVisible: false, height: 0 };
let keyboardListeners: Array<(state: KeyboardState) => void> = [];

/**
 * Set keyboard state - called by platform adapters
 */
export function setKeyboardState(state: KeyboardState) {
  keyboardState = state;
  keyboardListeners.forEach(listener => listener(state));
}

/**
 * Get current keyboard state
 */
export function getKeyboardState(): KeyboardState {
  return keyboardState;
}

/**
 * Subscribe to keyboard state changes
 */
export function subscribeToKeyboard(
  callback: (state: KeyboardState) => void
): () => void {
  keyboardListeners.push(callback);

  // Return unsubscribe function
  return () => {
    keyboardListeners = keyboardListeners.filter(
      listener => listener !== callback
    );
  };
}

/**
 * Check if keyboard is currently visible
 */
export function isKeyboardVisible(): boolean {
  return keyboardState.isVisible;
}

/**
 * Get current keyboard height
 */
export function getKeyboardHeight(): number {
  return keyboardState.height;
}

/**
 * Keyboard behavior utilities
 */
export interface KeyboardOptions {
  dismissOnTap?: boolean;
  adjustResize?: boolean;
  androidSoftInputMode?: 'adjustResize' | 'adjustPan' | 'adjustNothing';
}

let keyboardOptions: KeyboardOptions = {};

/**
 * Set keyboard behavior options
 */
export function setKeyboardOptions(options: KeyboardOptions) {
  keyboardOptions = { ...keyboardOptions, ...options };
}

/**
 * Get current keyboard options
 */
export function getKeyboardOptions(): KeyboardOptions {
  return keyboardOptions;
}

/**
 * Dismiss keyboard programmatically
 * Implementation will be platform-specific
 */
export type DismissKeyboardFn = () => void;

let dismissKeyboardFn: DismissKeyboardFn | null = null;

export function setDismissKeyboardFunction(fn: DismissKeyboardFn) {
  dismissKeyboardFn = fn;
}

export function dismissKeyboard() {
  if (dismissKeyboardFn) {
    dismissKeyboardFn();
  }
}

/**
 * Calculate content offset to avoid keyboard
 * Useful for forms and input fields
 */
export function calculateKeyboardAvoidingOffset(
  inputY: number,
  inputHeight: number,
  screenHeight: number,
  additionalPadding = 20
): number {
  if (!keyboardState.isVisible) return 0;

  const keyboardTop = screenHeight - keyboardState.height;
  const inputBottom = inputY + inputHeight;
  const requiredOffset = inputBottom - keyboardTop + additionalPadding;

  return Math.max(0, requiredOffset);
}

/**
 * Check if an input field would be hidden by keyboard
 */
export function wouldBeHiddenByKeyboard(
  inputY: number,
  inputHeight: number,
  screenHeight: number
): boolean {
  if (!keyboardState.isVisible) return false;

  const keyboardTop = screenHeight - keyboardState.height;
  const inputBottom = inputY + inputHeight;

  return inputBottom > keyboardTop;
}

/**
 * Common keyboard event types
 */
export interface KeyboardEvent {
  type: 'show' | 'hide';
  height: number;
  duration?: number;
}

export type KeyboardEventListener = (event: KeyboardEvent) => void;

let keyboardEventListeners: KeyboardEventListener[] = [];

/**
 * Subscribe to keyboard show/hide events
 */
export function subscribeToKeyboardEvents(
  listener: KeyboardEventListener
): () => void {
  keyboardEventListeners.push(listener);

  return () => {
    keyboardEventListeners = keyboardEventListeners.filter(l => l !== listener);
  };
}

/**
 * Trigger keyboard event - called by platform adapters
 */
export function triggerKeyboardEvent(event: KeyboardEvent) {
  keyboardEventListeners.forEach(listener => listener(event));
}
