/**
 * Groupi Design Themes
 *
 * Exports all theme definitions and shared tokens.
 */

export { groupiLight, sharedTokens } from './groupi-light';
export type { GroupiLightTheme, SharedTokens } from './groupi-light';

export { groupiDark } from './groupi-dark';
export type { GroupiDarkTheme } from './groupi-dark';

// Re-export for convenience
import { groupiLight, sharedTokens } from './groupi-light';
import { groupiDark } from './groupi-dark';

export const themes = {
  light: groupiLight,
  dark: groupiDark,
} as const;

export const tokens = sharedTokens;

export type Theme = typeof groupiLight | typeof groupiDark;
