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
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'text'
  | 'header'
  | 'list'
  | 'listitem'
  | 'search'
  | 'image'
  | 'tab'
  | 'tablist'
  | 'adjustable'
  | 'summary'
  | 'alert'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'checkbox'
  | 'radio'
  | 'radiogroup'
  | 'switch'
  | 'progressbar'
  | 'scrollbar'
  | 'spinbutton'
  | 'timer'
  | 'toolbar'
  | 'combobox'
  | 'grid';

/**
 * Accessibility state properties
 */
export interface AccessibilityState {
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
export type AccessibilityProps = Record<string, unknown>;

/**
 * Create accessible button props
 */
export function createButtonA11yProps(
  label: string,
  options?: {
    hint?: string;
    disabled?: boolean;
    selected?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: options?.hint,
    accessibilityState: {
      disabled: options?.disabled,
      selected: options?.selected,
    },
    accessible: true,
    testID: options?.testID,
  };
}

/**
 * Create accessible text input props
 * Note: React Native doesn't have a 'textinput' role, using 'none' instead
 * The TextInput component is inherently accessible
 */
export function createTextInputA11yProps(
  label: string,
  options?: {
    hint?: string;
    required?: boolean;
    invalid?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  const hint = options?.required
    ? `${options.hint || ''} Required field.`.trim()
    : options?.hint;

  return {
    accessibilityRole: 'none',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: false,
    },
    accessible: true,
    testID: options?.testID,
  };
}

/**
 * Create accessible heading props
 */
export function createHeadingA11yProps(
  text: string,
  level?: 1 | 2 | 3 | 4 | 5 | 6
): AccessibilityProps {
  return {
    accessibilityRole: 'header',
    accessibilityLabel: level ? `Heading level ${level}: ${text}` : text,
    accessible: true,
  };
}

/**
 * Create accessible list props
 */
export function createListA11yProps(
  itemCount: number,
  label?: string
): AccessibilityProps {
  const accessibilityLabel = label
    ? `${label}, ${itemCount} items`
    : `List with ${itemCount} items`;

  return {
    accessibilityRole: 'list',
    accessibilityLabel,
    accessible: true,
  };
}

/**
 * Create accessible list item props
 */
export function createListItemA11yProps(
  label: string,
  index?: number,
  total?: number
): AccessibilityProps {
  const positionInfo =
    index !== undefined && total !== undefined
      ? ` ${index + 1} of ${total}`
      : '';

  return {
    accessibilityRole: 'listitem',
    accessibilityLabel: `${label}${positionInfo}`,
    accessible: true,
  };
}

/**
 * Create accessible image props
 */
export function createImageA11yProps(
  alt: string,
  decorative = false
): AccessibilityProps {
  if (decorative) {
    return {
      accessible: false,
      accessibilityRole: 'image',
    };
  }

  return {
    accessibilityRole: 'image',
    accessibilityLabel: alt,
    accessible: true,
  };
}

/**
 * Create accessible status/alert props
 * Note: React Native only has 'alert' role, not 'status'. Using 'alert' for all.
 */
export function createStatusA11yProps(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): AccessibilityProps {
  return {
    accessibilityRole: 'alert',
    accessibilityLabel: `${type}: ${message}`,
    accessible: true,
  };
}

/**
 * Create accessible dialog props
 * Note: React Native doesn't have 'dialog' role, using 'none' instead
 */
export function createDialogA11yProps(
  title: string,
  description?: string
): AccessibilityProps {
  return {
    accessibilityRole: 'none',
    accessibilityLabel: title,
    accessibilityHint: description,
    accessible: true,
  };
}

/**
 * Create accessible tab props
 */
export function createTabA11yProps(
  label: string,
  selected: boolean,
  index: number,
  total: number
): AccessibilityProps {
  return {
    accessibilityRole: 'tab',
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected },
    accessible: true,
  };
}

/**
 * Create accessible form props
 * Note: React Native doesn't have 'form' role, using 'none' instead
 */
export function createFormA11yProps(
  title: string,
  description?: string
): AccessibilityProps {
  return {
    accessibilityRole: 'none',
    accessibilityLabel: title,
    accessibilityHint: description,
    accessible: true,
  };
}

/**
 * Focus management utilities
 */
export interface FocusManager {
  focus(element: unknown): void;
  blur(): void;
  moveFocusToNext(): void;
  moveFocusToPrevious(): void;
}

let focusManager: FocusManager | null = null;

export function setFocusManager(manager: FocusManager) {
  focusManager = manager;
}

export function getFocusManager(): FocusManager | null {
  return focusManager;
}

/**
 * Screen reader utilities
 */
export type AnnouncementType = 'polite' | 'assertive';

export interface ScreenReaderManager {
  announce(message: string, type?: AnnouncementType): void;
  isScreenReaderEnabled(): boolean;
}

let screenReaderManager: ScreenReaderManager | null = null;

export function setScreenReaderManager(manager: ScreenReaderManager) {
  screenReaderManager = manager;
}

export function announceToScreenReader(
  message: string,
  type: AnnouncementType = 'polite'
) {
  if (screenReaderManager) {
    screenReaderManager.announce(message, type);
  }
}

export function isScreenReaderEnabled(): boolean {
  return screenReaderManager?.isScreenReaderEnabled() || false;
}

/**
 * Color contrast utilities
 */
export function calculateContrastRatio(
  _color1: string,
  _color2: string
): number {
  // This is a simplified implementation
  // In practice, you'd want to use a proper color library
  return 4.5; // Placeholder - should meet WCAG AA standards
}

export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Text scaling utilities
 */
export function getScaledFontSize(baseFontSize: number, textScale = 1): number {
  return Math.round(baseFontSize * textScale);
}

export function isLargeTextScale(textScale: number): boolean {
  return textScale >= 1.3;
}
