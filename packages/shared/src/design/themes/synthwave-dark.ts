/**
 * Synthwave Dark Theme
 *
 * An 80s retro-inspired dark theme with hot pinks, electric cyans, and neon purples.
 * Nostalgic vibes with vibrant, glowing colors.
 */

import type { ThemeTokens } from './types';

export const synthwaveDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Neon retro colors
  // ==========================================================================
  brand: {
    primary: 'hsl(320, 95%, 60%)', // Hot pink
    primaryHover: 'hsl(320, 95%, 68%)',
    primaryActive: 'hsl(320, 95%, 52%)',
    primarySubtle: 'hsl(320, 50%, 18%)',
    secondary: 'hsl(180, 100%, 50%)', // Electric cyan
    secondaryHover: 'hsl(180, 100%, 58%)',
    accent: 'hsl(270, 90%, 65%)', // Neon purple
    accentHover: 'hsl(270, 90%, 72%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purples)
  // ==========================================================================
  background: {
    page: 'hsl(260, 50%, 6%)', // Deep purple-black
    surface: 'hsl(260, 45%, 10%)',
    elevated: 'hsl(260, 40%, 14%)',
    sunken: 'hsl(260, 55%, 4%)',
    overlay: 'hsl(260, 50%, 3%, 0.9)',
    interactive: 'hsl(260, 42%, 12%)',
    interactiveHover: 'hsl(260, 38%, 18%)',
    interactiveActive: 'hsl(260, 35%, 22%)',
    success: 'hsl(160, 80%, 40%)',
    successSubtle: 'hsl(160, 45%, 14%)',
    warning: 'hsl(45, 100%, 50%)',
    warningSubtle: 'hsl(45, 50%, 14%)',
    error: 'hsl(0, 75%, 52%)',
    errorSubtle: 'hsl(0, 45%, 14%)',
    info: 'hsl(180, 100%, 45%)',
    infoSubtle: 'hsl(180, 50%, 14%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - bright whites with cyan tint)
  // ==========================================================================
  text: {
    primary: 'hsl(180, 20%, 94%)',
    secondary: 'hsl(180, 15%, 72%)',
    tertiary: 'hsl(180, 10%, 60%)',
    muted: 'hsl(260, 12%, 55%)',
    disabled: 'hsl(260, 10%, 40%)',
    heading: 'hsl(180, 25%, 98%)',
    body: 'hsl(180, 20%, 92%)',
    caption: 'hsl(180, 15%, 68%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(180, 20%, 94%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(320, 95%, 70%)',
    linkHover: 'hsl(320, 95%, 80%)',
    success: 'hsl(160, 80%, 55%)',
    warning: 'hsl(45, 100%, 60%)',
    error: 'hsl(0, 75%, 65%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: 'hsl(260, 35%, 22%)',
    strong: 'hsl(260, 32%, 30%)',
    subtle: 'hsl(260, 40%, 14%)',
    focus: 'hsl(320, 95%, 60%)',
    error: 'hsl(0, 75%, 52%)',
    success: 'hsl(160, 80%, 40%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(320, 95%, 60%, 0.5)',
    selection: 'hsl(270, 90%, 65%, 0.25)',
    highlight: 'hsl(180, 100%, 50%, 0.15)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - extra vibrant)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 55%)',
    achievement: 'hsl(160, 80%, 50%)',
    streak: 'hsl(25, 100%, 58%)',
    party: 'hsl(320, 95%, 62%)',
  },

  // ==========================================================================
  // SHADOWS (Dark Mode - with glow effects)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
    pop: '0 4px 0 0 rgb(0 0 0 / 0.5)',
    glow: '0 0 30px 5px hsl(320 95% 60% / 0.4)', // Extra glowy
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.5)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(260, 50%, 6%)',
    foreground: 'hsl(180, 20%, 94%)',
    muted: 'hsl(260, 42%, 12%)',
    mutedForeground: 'hsl(260, 12%, 55%)',
    popover: 'hsl(260, 40%, 14%)',
    popoverForeground: 'hsl(180, 15%, 72%)',
    card: 'hsl(260, 45%, 10%)',
    cardForeground: 'hsl(180, 20%, 94%)',
    border: 'hsl(260, 35%, 22%)',
    input: 'hsl(260, 35%, 22%)',
    primary: 'hsl(320, 95%, 60%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(260, 42%, 12%)',
    secondaryForeground: 'hsl(180, 20%, 94%)',
    accent: 'hsl(270, 45%, 20%)',
    accentForeground: 'hsl(270, 50%, 92%)',
    destructive: 'hsl(0, 75%, 52%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(320, 95%, 60%)',
    radius: '0.5rem',
  },
} as const;

export type SynthwaveDarkTheme = typeof synthwaveDark;
