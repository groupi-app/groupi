/**
 * Sunset Light Theme
 *
 * A warm, coral-focused light theme inspired by golden hour sunsets.
 * Uses warm oranges, corals, and soft pinks.
 */

import type { ThemeTokens } from './types';

export const sunsetLight: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: 'hsl(15, 85%, 55%)', // Warm coral-orange
    primaryHover: 'hsl(15, 85%, 48%)',
    primaryActive: 'hsl(15, 85%, 42%)',
    primarySubtle: 'hsl(15, 70%, 94%)',
    secondary: 'hsl(340, 75%, 55%)', // Rose pink
    secondaryHover: 'hsl(340, 75%, 48%)',
    accent: 'hsl(45, 95%, 50%)', // Golden yellow
    accentHover: 'hsl(45, 95%, 42%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - warm creams)
  // ==========================================================================
  background: {
    page: 'hsl(30, 40%, 98%)',
    surface: 'hsl(0, 0%, 100%)',
    elevated: 'hsl(0, 0%, 100%)',
    sunken: 'hsl(30, 35%, 94%)',
    overlay: 'hsl(30, 30%, 20%, 0.5)',
    interactive: 'hsl(30, 30%, 96%)',
    interactiveHover: 'hsl(30, 30%, 92%)',
    interactiveActive: 'hsl(30, 30%, 88%)',
    success: 'hsl(145, 65%, 42%)',
    successSubtle: 'hsl(145, 60%, 92%)',
    warning: 'hsl(38, 95%, 50%)',
    warningSubtle: 'hsl(38, 80%, 92%)',
    error: 'hsl(0, 70%, 52%)',
    errorSubtle: 'hsl(0, 70%, 94%)',
    info: 'hsl(200, 80%, 50%)',
    infoSubtle: 'hsl(200, 70%, 94%)',
  },

  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: 'hsl(20, 25%, 15%)',
    secondary: 'hsl(20, 15%, 40%)',
    tertiary: 'hsl(20, 12%, 50%)',
    muted: 'hsl(20, 10%, 55%)',
    disabled: 'hsl(20, 8%, 65%)',
    heading: 'hsl(20, 30%, 12%)',
    body: 'hsl(20, 25%, 18%)',
    caption: 'hsl(20, 15%, 45%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(20, 25%, 15%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(15, 85%, 45%)',
    linkHover: 'hsl(15, 85%, 35%)',
    success: 'hsl(145, 70%, 32%)',
    warning: 'hsl(30, 90%, 38%)',
    error: 'hsl(0, 75%, 42%)',
  },

  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: 'hsl(30, 20%, 85%)',
    strong: 'hsl(30, 20%, 75%)',
    subtle: 'hsl(30, 25%, 92%)',
    focus: 'hsl(15, 85%, 55%)',
    error: 'hsl(0, 70%, 52%)',
    success: 'hsl(145, 65%, 42%)',
  },

  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(15, 85%, 55%, 0.4)',
    selection: 'hsl(15, 85%, 55%, 0.15)',
    highlight: 'hsl(45, 95%, 50%, 0.2)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 95%, 50%)',
    achievement: 'hsl(145, 65%, 45%)',
    streak: 'hsl(25, 100%, 55%)',
    party: 'hsl(340, 75%, 55%)',
  },

  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised:
      '0 1px 3px 0 hsl(20 30% 15% / 0.08), 0 1px 2px -1px hsl(20 30% 15% / 0.08)',
    floating:
      '0 4px 6px -1px hsl(20 30% 15% / 0.1), 0 2px 4px -2px hsl(20 30% 15% / 0.08)',
    overlay:
      '0 20px 25px -5px hsl(20 30% 15% / 0.12), 0 8px 10px -6px hsl(20 30% 15% / 0.08)',
    popup:
      '0 10px 15px -3px hsl(20 30% 15% / 0.1), 0 4px 6px -4px hsl(20 30% 15% / 0.08)',
    pop: '0 4px 0 0 hsl(20 30% 15% / 0.1)',
    glow: '0 0 15px 0 hsl(15 85% 55% / 0.25)',
    bounce: '0 2px 0 0 hsl(20 30% 15% / 0.1)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(30, 40%, 98%)',
    foreground: 'hsl(20, 25%, 15%)',
    muted: 'hsl(30, 30%, 94%)',
    mutedForeground: 'hsl(20, 10%, 55%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(20, 15%, 40%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(20, 25%, 15%)',
    border: 'hsl(30, 20%, 85%)',
    input: 'hsl(30, 20%, 85%)',
    primary: 'hsl(15, 85%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(30, 30%, 94%)',
    secondaryForeground: 'hsl(20, 25%, 15%)',
    accent: 'hsl(15, 50%, 94%)',
    accentForeground: 'hsl(15, 60%, 30%)',
    destructive: 'hsl(0, 70%, 52%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(15, 85%, 55%)',
    radius: '0.5rem',
  },
} as const;

export type SunsetLightTheme = typeof sunsetLight;
