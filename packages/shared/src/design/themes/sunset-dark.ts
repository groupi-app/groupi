/**
 * Sunset Dark Theme
 *
 * A warm, coral-focused dark theme inspired by sunset skies.
 * Uses warm oranges, corals, and soft pinks on deep warm backgrounds.
 */

import type { ThemeTokens } from './types';

export const sunsetDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: 'hsl(15, 85%, 58%)', // Warm coral-orange
    primaryHover: 'hsl(15, 85%, 65%)',
    primaryActive: 'hsl(15, 85%, 50%)',
    primarySubtle: 'hsl(15, 45%, 16%)',
    secondary: 'hsl(340, 75%, 62%)', // Rose pink
    secondaryHover: 'hsl(340, 75%, 70%)',
    accent: 'hsl(45, 95%, 55%)', // Golden yellow
    accentHover: 'hsl(45, 95%, 62%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - warm browns/mahogany)
  // ==========================================================================
  background: {
    page: 'hsl(15, 40%, 7%)', // Deep warm brown
    surface: 'hsl(15, 35%, 11%)',
    elevated: 'hsl(15, 30%, 15%)',
    sunken: 'hsl(15, 45%, 5%)',
    overlay: 'hsl(15, 40%, 4%, 0.85)',
    interactive: 'hsl(15, 32%, 13%)',
    interactiveHover: 'hsl(15, 28%, 19%)',
    interactiveActive: 'hsl(15, 25%, 23%)',
    success: 'hsl(145, 70%, 38%)',
    successSubtle: 'hsl(145, 40%, 14%)',
    warning: 'hsl(38, 92%, 50%)',
    warningSubtle: 'hsl(38, 40%, 14%)',
    error: 'hsl(0, 65%, 50%)',
    errorSubtle: 'hsl(0, 40%, 14%)',
    info: 'hsl(200, 85%, 52%)',
    infoSubtle: 'hsl(200, 40%, 14%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - warm whites)
  // ==========================================================================
  text: {
    primary: 'hsl(30, 30%, 94%)',
    secondary: 'hsl(30, 20%, 72%)',
    tertiary: 'hsl(30, 15%, 60%)',
    muted: 'hsl(30, 12%, 55%)',
    disabled: 'hsl(30, 10%, 40%)',
    heading: 'hsl(30, 35%, 97%)',
    body: 'hsl(30, 30%, 92%)',
    caption: 'hsl(30, 20%, 68%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(30, 30%, 94%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(15, 85%, 68%)',
    linkHover: 'hsl(15, 85%, 76%)',
    success: 'hsl(145, 70%, 58%)',
    warning: 'hsl(38, 92%, 62%)',
    error: 'hsl(0, 65%, 62%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: 'hsl(15, 28%, 20%)',
    strong: 'hsl(15, 25%, 28%)',
    subtle: 'hsl(15, 32%, 14%)',
    focus: 'hsl(15, 85%, 58%)',
    error: 'hsl(0, 65%, 50%)',
    success: 'hsl(145, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(15, 85%, 58%, 0.5)',
    selection: 'hsl(15, 85%, 58%, 0.25)',
    highlight: 'hsl(45, 95%, 55%, 0.12)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 95%, 58%)',
    achievement: 'hsl(145, 70%, 52%)',
    streak: 'hsl(25, 100%, 58%)',
    party: 'hsl(340, 75%, 62%)',
  },

  // ==========================================================================
  // SHADOWS (Dark Mode)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    pop: '0 4px 0 0 rgb(0 0 0 / 0.4)',
    glow: '0 0 20px 0 hsl(15 85% 58% / 0.35)',
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.4)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(15, 40%, 7%)',
    foreground: 'hsl(30, 30%, 94%)',
    muted: 'hsl(15, 32%, 13%)',
    mutedForeground: 'hsl(30, 12%, 55%)',
    popover: 'hsl(15, 30%, 15%)',
    popoverForeground: 'hsl(30, 20%, 72%)',
    card: 'hsl(15, 35%, 11%)',
    cardForeground: 'hsl(30, 30%, 94%)',
    border: 'hsl(15, 28%, 20%)',
    input: 'hsl(15, 28%, 20%)',
    primary: 'hsl(15, 85%, 58%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(15, 32%, 13%)',
    secondaryForeground: 'hsl(30, 30%, 94%)',
    accent: 'hsl(15, 35%, 18%)',
    accentForeground: 'hsl(15, 30%, 95%)',
    destructive: 'hsl(0, 65%, 50%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(15, 85%, 58%)',
    radius: '0.5rem',
  },
} as const;

export type SunsetDarkTheme = typeof sunsetDark;
