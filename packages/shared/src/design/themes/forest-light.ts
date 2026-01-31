/**
 * Forest Light Theme
 *
 * An earthy, nature-inspired light theme with forest greens and warm ambers.
 * Evokes peaceful woodland vibes.
 */

import type { ThemeTokens } from './types';

export const forestLight: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: 'hsl(150, 55%, 38%)', // Forest green
    primaryHover: 'hsl(150, 55%, 32%)',
    primaryActive: 'hsl(150, 55%, 28%)',
    primarySubtle: 'hsl(150, 45%, 92%)',
    secondary: 'hsl(35, 80%, 45%)', // Warm amber
    secondaryHover: 'hsl(35, 80%, 38%)',
    accent: 'hsl(85, 50%, 45%)', // Lime green
    accentHover: 'hsl(85, 50%, 38%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft creams with green tint)
  // ==========================================================================
  background: {
    page: 'hsl(90, 20%, 97%)',
    surface: 'hsl(0, 0%, 100%)',
    elevated: 'hsl(0, 0%, 100%)',
    sunken: 'hsl(90, 18%, 93%)',
    overlay: 'hsl(150, 30%, 15%, 0.5)',
    interactive: 'hsl(90, 15%, 95%)',
    interactiveHover: 'hsl(90, 15%, 91%)',
    interactiveActive: 'hsl(90, 15%, 87%)',
    success: 'hsl(145, 65%, 42%)',
    successSubtle: 'hsl(145, 55%, 92%)',
    warning: 'hsl(38, 95%, 50%)',
    warningSubtle: 'hsl(38, 80%, 92%)',
    error: 'hsl(0, 70%, 52%)',
    errorSubtle: 'hsl(0, 65%, 94%)',
    info: 'hsl(200, 80%, 50%)',
    infoSubtle: 'hsl(200, 65%, 94%)',
  },

  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: 'hsl(150, 25%, 15%)',
    secondary: 'hsl(150, 12%, 40%)',
    tertiary: 'hsl(150, 8%, 50%)',
    muted: 'hsl(150, 6%, 55%)',
    disabled: 'hsl(150, 5%, 65%)',
    heading: 'hsl(150, 30%, 12%)',
    body: 'hsl(150, 25%, 18%)',
    caption: 'hsl(150, 12%, 45%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(150, 25%, 15%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(150, 55%, 32%)',
    linkHover: 'hsl(150, 55%, 25%)',
    success: 'hsl(145, 70%, 32%)',
    warning: 'hsl(30, 90%, 38%)',
    error: 'hsl(0, 75%, 42%)',
  },

  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: 'hsl(90, 12%, 82%)',
    strong: 'hsl(90, 12%, 72%)',
    subtle: 'hsl(90, 15%, 90%)',
    focus: 'hsl(150, 55%, 38%)',
    error: 'hsl(0, 70%, 52%)',
    success: 'hsl(145, 65%, 42%)',
  },

  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(150, 55%, 38%, 0.4)',
    selection: 'hsl(150, 55%, 38%, 0.15)',
    highlight: 'hsl(35, 80%, 45%, 0.2)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: 'hsl(35, 85%, 50%)',
    achievement: 'hsl(150, 55%, 40%)',
    streak: 'hsl(25, 95%, 55%)',
    party: 'hsl(85, 50%, 48%)',
  },

  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised:
      '0 1px 3px 0 hsl(150 30% 15% / 0.08), 0 1px 2px -1px hsl(150 30% 15% / 0.08)',
    floating:
      '0 4px 6px -1px hsl(150 30% 15% / 0.1), 0 2px 4px -2px hsl(150 30% 15% / 0.08)',
    overlay:
      '0 20px 25px -5px hsl(150 30% 15% / 0.12), 0 8px 10px -6px hsl(150 30% 15% / 0.08)',
    popup:
      '0 10px 15px -3px hsl(150 30% 15% / 0.1), 0 4px 6px -4px hsl(150 30% 15% / 0.08)',
    pop: '0 4px 0 0 hsl(150 30% 15% / 0.1)',
    glow: '0 0 15px 0 hsl(150 55% 38% / 0.25)',
    bounce: '0 2px 0 0 hsl(150 30% 15% / 0.1)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(90, 20%, 97%)',
    foreground: 'hsl(150, 25%, 15%)',
    muted: 'hsl(90, 15%, 93%)',
    mutedForeground: 'hsl(150, 6%, 55%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(150, 12%, 40%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(150, 25%, 15%)',
    border: 'hsl(90, 12%, 82%)',
    input: 'hsl(90, 12%, 82%)',
    primary: 'hsl(150, 55%, 38%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(90, 15%, 93%)',
    secondaryForeground: 'hsl(150, 25%, 15%)',
    accent: 'hsl(150, 40%, 92%)',
    accentForeground: 'hsl(150, 50%, 25%)',
    destructive: 'hsl(0, 70%, 52%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(150, 55%, 38%)',
    radius: '0.5rem',
  },
} as const;

export type ForestLightTheme = typeof forestLight;
