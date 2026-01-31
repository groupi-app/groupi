/**
 * Theme System Type Definitions
 *
 * Defines the structure for base themes and custom themes.
 * This is the single source of truth for theme-related types.
 */

// ==========================================================================
// THEME TOKEN STRUCTURE
// ==========================================================================

/**
 * Brand color tokens - Primary identity colors
 */
export interface BrandTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
}

/**
 * Background color tokens - Surface and container colors
 */
export interface BackgroundTokens {
  page: string;
  surface: string;
  elevated: string;
  sunken: string;
  overlay: string;
  interactive: string;
  interactiveHover: string;
  interactiveActive: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  info: string;
  infoSubtle: string;
}

/**
 * Text color tokens - Typography colors
 */
export interface TextTokens {
  primary: string;
  secondary: string;
  tertiary: string;
  muted: string;
  disabled: string;
  heading: string;
  body: string;
  caption: string;
  onPrimary: string;
  onSurface: string;
  onError: string;
  link: string;
  linkHover: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Border color tokens
 */
export interface BorderTokens {
  default: string;
  strong: string;
  subtle: string;
  focus: string;
  error: string;
  success: string;
}

/**
 * State color tokens - Interactive states
 */
export interface StateTokens {
  focusRing: string;
  selection: string;
  highlight: string;
}

/**
 * Fun/celebration color tokens - Gamification (Duolingo-inspired)
 */
export interface FunTokens {
  celebration: string;
  achievement: string;
  streak: string;
  party: string;
}

/**
 * Shadow tokens - Elevation levels
 */
export interface ShadowTokens {
  raised: string;
  floating: string;
  overlay: string;
  popup: string;
  pop: string;
  glow: string;
  bounce: string;
}

/**
 * Legacy tokens for shadcn/ui backwards compatibility
 */
export interface LegacyTokens {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  ring: string;
  radius: string;
}

/**
 * Complete theme tokens structure
 */
export interface ThemeTokens {
  brand: BrandTokens;
  background: BackgroundTokens;
  text: TextTokens;
  border: BorderTokens;
  state: StateTokens;
  fun: FunTokens;
  shadow: ShadowTokens;
  legacy: LegacyTokens;
}

// ==========================================================================
// BASE THEME DEFINITION
// ==========================================================================

/**
 * Theme mode - used for system preference matching
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Preview colors for theme picker cards
 */
export interface ThemePreview {
  /** Primary brand color */
  primary: string;
  /** Page background color */
  background: string;
  /** Accent color */
  accent: string;
}

/**
 * Base theme definition - pre-built themes shipped with the app
 */
export interface BaseTheme {
  /** Unique identifier (e.g., 'groupi-light', 'ocean-dark') */
  id: string;
  /** Display name (e.g., 'Groupi Light') */
  name: string;
  /** Brief description */
  description: string;
  /** Light or dark mode for system preference matching */
  mode: ThemeMode;
  /** Preview colors for theme picker cards */
  preview: ThemePreview;
  /** Full theme token values */
  tokens: ThemeTokens;
}

/**
 * Theme registry - all available base themes
 */
export type ThemeRegistry = Record<string, BaseTheme>;

// ==========================================================================
// CUSTOM THEME OVERRIDES
// ==========================================================================

/**
 * Editable token categories for custom themes
 * These are a curated subset of tokens that users can customize
 */
export interface EditableBrandTokens {
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface EditableBackgroundTokens {
  page?: string;
  surface?: string;
  elevated?: string;
  sunken?: string;
}

export interface EditableTextTokens {
  primary?: string;
  secondary?: string;
  heading?: string;
  muted?: string;
}

export interface EditableStatusTokens {
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

export interface EditableShadowTokens {
  raised?: string;
  floating?: string;
}

/**
 * Token overrides for custom themes
 * Only stores the tokens that differ from the base theme
 */
export interface ThemeTokenOverrides {
  brand?: EditableBrandTokens;
  background?: EditableBackgroundTokens;
  text?: EditableTextTokens;
  status?: EditableStatusTokens;
  shadow?: EditableShadowTokens;
}

/**
 * Custom theme definition - user-created themes stored in database
 */
export interface CustomTheme {
  /** Database ID */
  id: string;
  /** Owner's person ID */
  personId: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Base theme this extends */
  baseThemeId: string;
  /** Light or dark mode (inherited from base) */
  mode: ThemeMode;
  /** Token overrides (only stores differences from base) */
  tokenOverrides: ThemeTokenOverrides;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

// ==========================================================================
// THEME PREFERENCES
// ==========================================================================

/**
 * Theme selection type
 */
export type ThemeSelectionType = 'base' | 'custom';

/**
 * User theme preferences stored in database
 */
export interface ThemePreferences {
  /** Type of selected theme */
  selectedThemeType: ThemeSelectionType;
  /** Selected base theme ID */
  selectedThemeId: string;
  /** Selected custom theme ID (if type is 'custom') */
  selectedCustomThemeId?: string;
  /** Whether to use system preference for auto-switching */
  useSystemPreference: boolean;
  /** Base theme to use when system is in light mode */
  systemLightThemeId: string;
  /** Base theme to use when system is in dark mode */
  systemDarkThemeId: string;
}

// ==========================================================================
// EDITOR STATE
// ==========================================================================

/**
 * Theme editor state for undo/redo
 */
export interface ThemeEditorState {
  /** Base theme being extended */
  baseThemeId: string;
  /** Current token overrides */
  tokenOverrides: ThemeTokenOverrides;
  /** History for undo */
  history: ThemeTokenOverrides[];
  /** Current position in history */
  historyIndex: number;
  /** Whether there are unsaved changes */
  isDirty: boolean;
}

/**
 * Editable token category names
 */
export type EditableTokenCategory =
  | 'brand'
  | 'background'
  | 'text'
  | 'status'
  | 'fun'
  | 'shadow';

/**
 * Token definition for the editor
 */
export interface EditableTokenDef {
  /** Token key within category */
  key: string;
  /** Display label */
  label: string;
  /** Help text */
  description?: string;
  /** CSS variable name */
  cssVar: string;
}

/**
 * Category definition for the editor
 */
export interface EditableTokenCategoryDef {
  /** Category key */
  key: EditableTokenCategory;
  /** Display label */
  label: string;
  /** User-friendly name */
  friendlyName: string;
  /** Category description */
  description: string;
  /** Tokens in this category */
  tokens: EditableTokenDef[];
}
