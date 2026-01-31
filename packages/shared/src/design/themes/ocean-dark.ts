/**
 * Ocean Dark Theme
 *
 * A calm, blue-focused dark theme inspired by the deep ocean.
 * Uses deep blues with bright cyan/teal accents for a modern feel.
 */

import type { ThemeTokens } from './types';

export const oceanDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Bright ocean blues for dark mode
  // ==========================================================================
  brand: {
    primary: 'hsl(200, 85%, 55%)',
    primaryHover: 'hsl(200, 85%, 62%)',
    primaryActive: 'hsl(200, 85%, 48%)',
    primarySubtle: 'hsl(200, 60%, 15%)',
    secondary: 'hsl(180, 70%, 50%)',
    secondaryHover: 'hsl(180, 70%, 58%)',
    accent: 'hsl(170, 80%, 50%)',
    accentHover: 'hsl(170, 80%, 58%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep ocean blues)
  // ==========================================================================
  background: {
    page: 'hsl(210, 50%, 6%)',
    surface: 'hsl(210, 45%, 10%)',
    elevated: 'hsl(210, 40%, 14%)',
    sunken: 'hsl(210, 55%, 4%)',
    overlay: 'hsl(210, 50%, 5%, 0.7)',
    interactive: 'hsl(210, 40%, 14%)',
    interactiveHover: 'hsl(210, 35%, 20%)',
    interactiveActive: 'hsl(210, 30%, 25%)',
    success: 'hsl(160, 70%, 38%)',
    successSubtle: 'hsl(160, 50%, 12%)',
    warning: 'hsl(38, 90%, 48%)',
    warningSubtle: 'hsl(38, 50%, 12%)',
    error: 'hsl(0, 65%, 48%)',
    errorSubtle: 'hsl(0, 45%, 12%)',
    info: 'hsl(200, 85%, 48%)',
    infoSubtle: 'hsl(200, 50%, 12%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast)
  // ==========================================================================
  text: {
    primary: 'hsl(200, 25%, 92%)',
    secondary: 'hsl(200, 18%, 68%)',
    tertiary: 'hsl(200, 14%, 58%)',
    muted: 'hsl(200, 12%, 58%)',
    disabled: 'hsl(200, 10%, 42%)',
    heading: 'hsl(200, 30%, 96%)',
    body: 'hsl(200, 25%, 92%)',
    caption: 'hsl(200, 18%, 68%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(200, 25%, 92%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(200, 85%, 65%)',
    linkHover: 'hsl(200, 85%, 75%)',
    success: 'hsl(160, 70%, 55%)',
    warning: 'hsl(38, 90%, 62%)',
    error: 'hsl(0, 65%, 62%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: 'hsl(210, 35%, 18%)',
    strong: 'hsl(210, 30%, 26%)',
    subtle: 'hsl(210, 40%, 12%)',
    focus: 'hsl(200, 85%, 55%)',
    error: 'hsl(0, 65%, 48%)',
    success: 'hsl(160, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(200, 85%, 55%, 0.5)',
    selection: 'hsl(200, 85%, 55%, 0.2)',
    highlight: 'hsl(170, 80%, 50%, 0.15)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - brighter)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 55%)',
    achievement: 'hsl(160, 70%, 50%)',
    streak: 'hsl(25, 100%, 60%)',
    party: 'hsl(170, 80%, 55%)',
  },

  // ==========================================================================
  // SHADOWS (Dark Mode - higher opacity)
  // ==========================================================================
  shadow: {
    raised:
      '0 1px 3px 0 hsl(210 50% 5% / 0.3), 0 1px 2px -1px hsl(210 50% 5% / 0.3)',
    floating:
      '0 4px 6px -1px hsl(210 50% 5% / 0.4), 0 2px 4px -2px hsl(210 50% 5% / 0.3)',
    overlay:
      '0 20px 25px -5px hsl(210 50% 5% / 0.4), 0 8px 10px -6px hsl(210 50% 5% / 0.3)',
    popup:
      '0 10px 15px -3px hsl(210 50% 5% / 0.4), 0 4px 6px -4px hsl(210 50% 5% / 0.3)',
    pop: '0 4px 0 0 hsl(210 50% 5% / 0.3)',
    glow: '0 0 20px 0 hsl(200 85% 55% / 0.4)',
    bounce: '0 2px 0 0 hsl(210 50% 5% / 0.3)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(210, 50%, 6%)',
    foreground: 'hsl(200, 25%, 92%)',
    muted: 'hsl(210, 40%, 12%)',
    mutedForeground: 'hsl(200, 12%, 58%)',
    popover: 'hsl(210, 50%, 6%)',
    popoverForeground: 'hsl(200, 18%, 68%)',
    card: 'hsl(210, 50%, 6%)',
    cardForeground: 'hsl(200, 25%, 92%)',
    border: 'hsl(210, 35%, 18%)',
    input: 'hsl(210, 35%, 18%)',
    primary: 'hsl(200, 85%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(210, 40%, 14%)',
    secondaryForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(200, 35%, 16%)',
    accentForeground: 'hsl(170, 40%, 95%)',
    destructive: 'hsl(0, 60%, 48%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(200, 85%, 55%)',
    radius: '0.5rem',
  },
} as const;

export type OceanDarkTheme = typeof oceanDark;
