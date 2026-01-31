/**
 * Groupi Design Themes
 *
 * Exports all theme definitions, shared tokens, and theme registry.
 * This is the central hub for all theme-related exports.
 */

// ==========================================================================
// TYPE EXPORTS
// ==========================================================================

export type {
  ThemeTokens,
  BrandTokens,
  BackgroundTokens,
  TextTokens,
  BorderTokens,
  StateTokens,
  FunTokens,
  ShadowTokens,
  LegacyTokens,
  ThemeMode,
  ThemePreview,
  BaseTheme,
  ThemeRegistry,
  ThemeTokenOverrides,
  EditableBrandTokens,
  EditableBackgroundTokens,
  EditableTextTokens,
  EditableStatusTokens,
  EditableShadowTokens,
  CustomTheme,
  ThemeSelectionType,
  ThemePreferences,
  ThemeEditorState,
  EditableTokenCategory,
  EditableTokenDef,
  EditableTokenCategoryDef,
} from './types';

// ==========================================================================
// THEME TOKEN EXPORTS
// ==========================================================================

export { groupiLight, sharedTokens } from './groupi-light';
export type { GroupiLightTheme, SharedTokens } from './groupi-light';

export { groupiDark } from './groupi-dark';
export type { GroupiDarkTheme } from './groupi-dark';

export { oledDark } from './oled-dark';
export type { OledDarkTheme } from './oled-dark';

export { oceanLight } from './ocean-light';
export type { OceanLightTheme } from './ocean-light';

export { oceanDark } from './ocean-dark';
export type { OceanDarkTheme } from './ocean-dark';

export { transcendLight } from './transcend-light';
export type { TranscendLightTheme } from './transcend-light';

export { transcendDark } from './transcend-dark';
export type { TranscendDarkTheme } from './transcend-dark';

export { sunsetLight } from './sunset-light';
export type { SunsetLightTheme } from './sunset-light';

export { sunsetDark } from './sunset-dark';
export type { SunsetDarkTheme } from './sunset-dark';

export { forestLight } from './forest-light';
export type { ForestLightTheme } from './forest-light';

export { forestDark } from './forest-dark';
export type { ForestDarkTheme } from './forest-dark';

export { synthwaveDark } from './synthwave-dark';
export type { SynthwaveDarkTheme } from './synthwave-dark';

// ==========================================================================
// BASE THEME DEFINITIONS WITH METADATA
// ==========================================================================

import { groupiLight, sharedTokens } from './groupi-light';
import { groupiDark } from './groupi-dark';
import { oledDark } from './oled-dark';
import { oceanLight } from './ocean-light';
import { oceanDark } from './ocean-dark';
import { transcendLight } from './transcend-light';
import { transcendDark } from './transcend-dark';
import { sunsetLight } from './sunset-light';
import { sunsetDark } from './sunset-dark';
import { forestLight } from './forest-light';
import { forestDark } from './forest-dark';
import { synthwaveDark } from './synthwave-dark';
import type { BaseTheme, ThemeRegistry } from './types';

/**
 * Groupi Light - Default light theme
 * The original purple-focused Groupi identity
 */
export const groupiLightTheme: BaseTheme = {
  id: 'groupi-light',
  name: 'Groupi Light',
  description: 'The default purple-focused light theme',
  mode: 'light',
  preview: {
    primary: groupiLight.brand.primary,
    background: groupiLight.background.page,
    accent: groupiLight.brand.accent,
  },
  tokens: groupiLight,
};

/**
 * Groupi Dark - Default dark theme
 * The original purple-focused Groupi identity in dark mode
 */
export const groupiDarkTheme: BaseTheme = {
  id: 'groupi-dark',
  name: 'Groupi Dark',
  description: 'The default purple-focused dark theme',
  mode: 'dark',
  preview: {
    primary: groupiDark.brand.primary,
    background: groupiDark.background.page,
    accent: groupiDark.brand.accent,
  },
  tokens: groupiDark,
};

/**
 * OLED Dark - True black theme for OLED screens
 * Pure black backgrounds with vibrant accents
 */
export const oledDarkTheme: BaseTheme = {
  id: 'oled-dark',
  name: 'OLED Dark',
  description: 'True black theme optimized for OLED screens',
  mode: 'dark',
  preview: {
    primary: oledDark.brand.primary,
    background: oledDark.background.page,
    accent: oledDark.brand.accent,
  },
  tokens: oledDark,
};

/**
 * Ocean Light - Blue-focused light theme
 * A calm, refreshing ocean-inspired theme
 */
export const oceanLightTheme: BaseTheme = {
  id: 'ocean-light',
  name: 'Ocean Light',
  description: 'A calm, blue-focused light theme',
  mode: 'light',
  preview: {
    primary: oceanLight.brand.primary,
    background: oceanLight.background.page,
    accent: oceanLight.brand.accent,
  },
  tokens: oceanLight,
};

/**
 * Ocean Dark - Blue-focused dark theme
 * Deep ocean vibes with bright cyan accents
 */
export const oceanDarkTheme: BaseTheme = {
  id: 'ocean-dark',
  name: 'Ocean Dark',
  description: 'A calm, blue-focused dark theme',
  mode: 'dark',
  preview: {
    primary: oceanDark.brand.primary,
    background: oceanDark.background.page,
    accent: oceanDark.brand.accent,
  },
  tokens: oceanDark,
};

/**
 * Transcend Light - Trans pride inspired light theme
 * Vibrant pinks and blues on soft backgrounds
 */
export const transcendLightTheme: BaseTheme = {
  id: 'transcend-light',
  name: 'Transcend Light',
  description: 'Trans pride inspired with vibrant pinks and blues',
  mode: 'light',
  preview: {
    primary: transcendLight.brand.primary,
    background: transcendLight.background.page,
    accent: transcendLight.brand.accent,
  },
  tokens: transcendLight,
};

/**
 * Transcend Dark - Trans pride inspired theme
 * Vibrant pinks and blues on deep purple
 */
export const transcendDarkTheme: BaseTheme = {
  id: 'transcend-dark',
  name: 'Transcend Dark',
  description: 'Trans pride inspired with vibrant pinks and blues',
  mode: 'dark',
  preview: {
    primary: transcendDark.brand.primary,
    background: transcendDark.background.page,
    accent: transcendDark.brand.accent,
  },
  tokens: transcendDark,
};

/**
 * Sunset Light - Warm coral and orange light theme
 * Golden hour warmth
 */
export const sunsetLightTheme: BaseTheme = {
  id: 'sunset-light',
  name: 'Sunset Light',
  description: 'Warm coral and orange inspired by golden hour',
  mode: 'light',
  preview: {
    primary: sunsetLight.brand.primary,
    background: sunsetLight.background.page,
    accent: sunsetLight.brand.accent,
  },
  tokens: sunsetLight,
};

/**
 * Sunset Dark - Warm coral and orange dark theme
 * Cozy sunset vibes
 */
export const sunsetDarkTheme: BaseTheme = {
  id: 'sunset-dark',
  name: 'Sunset Dark',
  description: 'Warm coral and orange on deep mahogany',
  mode: 'dark',
  preview: {
    primary: sunsetDark.brand.primary,
    background: sunsetDark.background.page,
    accent: sunsetDark.brand.accent,
  },
  tokens: sunsetDark,
};

/**
 * Forest Light - Earthy green light theme
 * Nature-inspired tranquility
 */
export const forestLightTheme: BaseTheme = {
  id: 'forest-light',
  name: 'Forest Light',
  description: 'Earthy greens and warm ambers',
  mode: 'light',
  preview: {
    primary: forestLight.brand.primary,
    background: forestLight.background.page,
    accent: forestLight.brand.accent,
  },
  tokens: forestLight,
};

/**
 * Forest Dark - Earthy green dark theme
 * Deep woodland atmosphere
 */
export const forestDarkTheme: BaseTheme = {
  id: 'forest-dark',
  name: 'Forest Dark',
  description: 'Deep forest greens with amber glow',
  mode: 'dark',
  preview: {
    primary: forestDark.brand.primary,
    background: forestDark.background.page,
    accent: forestDark.brand.accent,
  },
  tokens: forestDark,
};

/**
 * Synthwave Dark - 80s retro neon theme
 * Hot pinks, electric cyans, nostalgic vibes
 */
export const synthwaveDarkTheme: BaseTheme = {
  id: 'synthwave-dark',
  name: 'Synthwave',
  description: '80s retro with hot pink and electric cyan',
  mode: 'dark',
  preview: {
    primary: synthwaveDark.brand.primary,
    background: synthwaveDark.background.page,
    accent: synthwaveDark.brand.accent,
  },
  tokens: synthwaveDark,
};

// ==========================================================================
// THEME REGISTRY
// ==========================================================================

/**
 * All available base themes indexed by ID
 */
export const baseThemeRegistry: ThemeRegistry = {
  'groupi-light': groupiLightTheme,
  'groupi-dark': groupiDarkTheme,
  'oled-dark': oledDarkTheme,
  'ocean-light': oceanLightTheme,
  'ocean-dark': oceanDarkTheme,
  'transcend-light': transcendLightTheme,
  'transcend-dark': transcendDarkTheme,
  'sunset-light': sunsetLightTheme,
  'sunset-dark': sunsetDarkTheme,
  'forest-light': forestLightTheme,
  'forest-dark': forestDarkTheme,
  'synthwave-dark': synthwaveDarkTheme,
};

/**
 * All base themes as an array (useful for iteration)
 */
export const baseThemes: BaseTheme[] = Object.values(baseThemeRegistry);

/**
 * Light themes only
 */
export const lightThemes: BaseTheme[] = baseThemes.filter(
  theme => theme.mode === 'light'
);

/**
 * Dark themes only
 */
export const darkThemes: BaseTheme[] = baseThemes.filter(
  theme => theme.mode === 'dark'
);

/**
 * Default theme IDs
 */
export const DEFAULT_LIGHT_THEME_ID = 'groupi-light';
export const DEFAULT_DARK_THEME_ID = 'groupi-dark';

/**
 * Get a base theme by ID
 */
export function getBaseTheme(id: string): BaseTheme | undefined {
  return baseThemeRegistry[id];
}

/**
 * Get the paired theme (light → dark, dark → light)
 * For themes in the same family (e.g., groupi-light → groupi-dark)
 */
export function getPairedTheme(id: string): BaseTheme | undefined {
  const theme = baseThemeRegistry[id];
  if (!theme) return undefined;

  // Extract family name (e.g., 'groupi' from 'groupi-light')
  const family = id.replace(/-light$|-dark$/, '');
  const pairedMode = theme.mode === 'light' ? 'dark' : 'light';
  const pairedId = `${family}-${pairedMode}`;

  return baseThemeRegistry[pairedId];
}

// ==========================================================================
// LEGACY EXPORTS (backwards compatibility)
// ==========================================================================

/**
 * @deprecated Use baseThemeRegistry instead
 */
export const themes = {
  light: groupiLight,
  dark: groupiDark,
} as const;

/**
 * Shared tokens (spacing, radius, duration, etc.)
 * These are the same across all themes
 */
export const tokens = sharedTokens;

/**
 * @deprecated Use ThemeTokens type instead
 */
export type Theme = typeof groupiLight | typeof groupiDark;
