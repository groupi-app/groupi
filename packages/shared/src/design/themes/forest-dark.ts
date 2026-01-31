/**
 * Forest Dark Theme
 *
 * An earthy, nature-inspired dark theme with forest greens and warm ambers.
 * Deep woodland atmosphere with glowing accents.
 */

import type { ThemeTokens } from './types';

export const forestDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: 'hsl(150, 55%, 45%)', // Forest green
    primaryHover: 'hsl(150, 55%, 52%)',
    primaryActive: 'hsl(150, 55%, 38%)',
    primarySubtle: 'hsl(150, 35%, 15%)',
    secondary: 'hsl(35, 80%, 52%)', // Warm amber
    secondaryHover: 'hsl(35, 80%, 60%)',
    accent: 'hsl(85, 55%, 52%)', // Lime green
    accentHover: 'hsl(85, 55%, 60%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep forest greens)
  // ==========================================================================
  background: {
    page: 'hsl(150, 35%, 7%)', // Deep forest green
    surface: 'hsl(150, 30%, 11%)',
    elevated: 'hsl(150, 25%, 15%)',
    sunken: 'hsl(150, 40%, 5%)',
    overlay: 'hsl(150, 35%, 4%, 0.85)',
    interactive: 'hsl(150, 28%, 13%)',
    interactiveHover: 'hsl(150, 24%, 19%)',
    interactiveActive: 'hsl(150, 20%, 23%)',
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
  // TEXT COLORS (Dark Mode - warm whites with green tint)
  // ==========================================================================
  text: {
    primary: 'hsl(90, 20%, 94%)',
    secondary: 'hsl(90, 15%, 72%)',
    tertiary: 'hsl(90, 10%, 60%)',
    muted: 'hsl(90, 8%, 55%)',
    disabled: 'hsl(90, 6%, 40%)',
    heading: 'hsl(90, 25%, 97%)',
    body: 'hsl(90, 20%, 92%)',
    caption: 'hsl(90, 15%, 68%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(90, 20%, 94%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(150, 55%, 55%)',
    linkHover: 'hsl(150, 55%, 65%)',
    success: 'hsl(145, 70%, 58%)',
    warning: 'hsl(38, 92%, 62%)',
    error: 'hsl(0, 65%, 62%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: 'hsl(150, 25%, 20%)',
    strong: 'hsl(150, 22%, 28%)',
    subtle: 'hsl(150, 28%, 14%)',
    focus: 'hsl(150, 55%, 45%)',
    error: 'hsl(0, 65%, 50%)',
    success: 'hsl(145, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(150, 55%, 45%, 0.5)',
    selection: 'hsl(150, 55%, 45%, 0.25)',
    highlight: 'hsl(35, 80%, 52%, 0.12)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: 'hsl(35, 85%, 55%)',
    achievement: 'hsl(150, 55%, 48%)',
    streak: 'hsl(25, 95%, 58%)',
    party: 'hsl(85, 55%, 55%)',
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
    glow: '0 0 20px 0 hsl(150 55% 45% / 0.35)',
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.4)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(150, 35%, 7%)',
    foreground: 'hsl(90, 20%, 94%)',
    muted: 'hsl(150, 28%, 13%)',
    mutedForeground: 'hsl(90, 8%, 55%)',
    popover: 'hsl(150, 25%, 15%)',
    popoverForeground: 'hsl(90, 15%, 72%)',
    card: 'hsl(150, 30%, 11%)',
    cardForeground: 'hsl(90, 20%, 94%)',
    border: 'hsl(150, 25%, 20%)',
    input: 'hsl(150, 25%, 20%)',
    primary: 'hsl(150, 55%, 45%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(150, 28%, 13%)',
    secondaryForeground: 'hsl(90, 20%, 94%)',
    accent: 'hsl(150, 30%, 18%)',
    accentForeground: 'hsl(150, 30%, 95%)',
    destructive: 'hsl(0, 65%, 50%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(150, 55%, 45%)',
    radius: '0.5rem',
  },
} as const;

export type ForestDarkTheme = typeof forestDark;
