/**
 * Ocean Light Theme
 *
 * A calm, blue-focused light theme inspired by the ocean.
 * Uses cool blues, teals, and aqua tones for a refreshing feel.
 */

import type { ThemeTokens } from './types';

export const oceanLight: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Ocean blues
  // ==========================================================================
  brand: {
    primary: 'hsl(200, 85%, 40%)',
    primaryHover: 'hsl(200, 85%, 34%)',
    primaryActive: 'hsl(200, 85%, 30%)',
    primarySubtle: 'hsl(200, 85%, 94%)',
    secondary: 'hsl(180, 70%, 40%)',
    secondaryHover: 'hsl(180, 70%, 34%)',
    accent: 'hsl(170, 80%, 45%)',
    accentHover: 'hsl(170, 80%, 38%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS
  // ==========================================================================
  background: {
    page: 'hsl(200, 30%, 99%)',
    surface: 'hsl(200, 20%, 100%)',
    elevated: 'hsl(200, 25%, 100%)',
    sunken: 'hsl(200, 25%, 96%)',
    overlay: 'hsl(200, 30%, 10%, 0.5)',
    interactive: 'hsl(200, 20%, 96%)',
    interactiveHover: 'hsl(200, 22%, 91%)',
    interactiveActive: 'hsl(200, 18%, 85%)',
    success: 'hsl(160, 75%, 42%)',
    successSubtle: 'hsl(160, 75%, 92%)',
    warning: 'hsl(38, 95%, 52%)',
    warningSubtle: 'hsl(38, 95%, 92%)',
    error: 'hsl(0, 75%, 55%)',
    errorSubtle: 'hsl(0, 75%, 94%)',
    info: 'hsl(200, 85%, 50%)',
    infoSubtle: 'hsl(200, 85%, 94%)',
  },

  // ==========================================================================
  // TEXT COLORS
  // ==========================================================================
  text: {
    primary: 'hsl(200, 35%, 15%)',
    secondary: 'hsl(200, 20%, 40%)',
    tertiary: 'hsl(200, 15%, 50%)',
    muted: 'hsl(200, 12%, 50%)',
    disabled: 'hsl(200, 10%, 65%)',
    heading: 'hsl(200, 40%, 12%)',
    body: 'hsl(200, 35%, 15%)',
    caption: 'hsl(200, 20%, 40%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(200, 35%, 15%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(200, 85%, 40%)',
    linkHover: 'hsl(200, 85%, 30%)',
    success: 'hsl(160, 75%, 28%)',
    warning: 'hsl(38, 95%, 36%)',
    error: 'hsl(0, 75%, 46%)',
  },

  // ==========================================================================
  // BORDER COLORS
  // ==========================================================================
  border: {
    default: 'hsl(200, 25%, 88%)',
    strong: 'hsl(200, 20%, 78%)',
    subtle: 'hsl(200, 30%, 94%)',
    focus: 'hsl(200, 85%, 40%)',
    error: 'hsl(0, 75%, 55%)',
    success: 'hsl(160, 75%, 42%)',
  },

  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: 'hsl(200, 85%, 40%, 0.4)',
    selection: 'hsl(200, 85%, 40%, 0.15)',
    highlight: 'hsl(170, 80%, 45%, 0.2)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 50%)',
    achievement: 'hsl(160, 75%, 42%)',
    streak: 'hsl(25, 100%, 55%)',
    party: 'hsl(170, 80%, 45%)',
  },

  // ==========================================================================
  // SHADOWS
  // ==========================================================================
  shadow: {
    raised:
      '0 1px 3px 0 hsl(200 30% 20% / 0.08), 0 1px 2px -1px hsl(200 30% 20% / 0.08)',
    floating:
      '0 4px 6px -1px hsl(200 30% 20% / 0.08), 0 2px 4px -2px hsl(200 30% 20% / 0.08)',
    overlay:
      '0 20px 25px -5px hsl(200 30% 20% / 0.1), 0 8px 10px -6px hsl(200 30% 20% / 0.08)',
    popup:
      '0 10px 15px -3px hsl(200 30% 20% / 0.08), 0 4px 6px -4px hsl(200 30% 20% / 0.08)',
    pop: '0 4px 0 0 hsl(200 30% 20% / 0.08)',
    glow: '0 0 20px 0 hsl(200 85% 40% / 0.3)',
    bounce: '0 2px 0 0 hsl(200 30% 20% / 0.08)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(200, 30%, 99%)',
    foreground: 'hsl(200, 35%, 15%)',
    muted: 'hsl(200, 25%, 96%)',
    mutedForeground: 'hsl(200, 12%, 50%)',
    popover: 'hsl(200, 20%, 100%)',
    popoverForeground: 'hsl(200, 35%, 15%)',
    card: 'hsl(200, 20%, 100%)',
    cardForeground: 'hsl(200, 35%, 15%)',
    border: 'hsl(200, 25%, 88%)',
    input: 'hsl(200, 25%, 88%)',
    primary: 'hsl(200, 85%, 40%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(200, 25%, 96%)',
    secondaryForeground: 'hsl(200, 35%, 15%)',
    accent: 'hsl(170, 30%, 95%)',
    accentForeground: 'hsl(170, 40%, 15%)',
    destructive: 'hsl(0, 75%, 55%)',
    destructiveForeground: 'hsl(0, 0%, 100%)',
    ring: 'hsl(200, 25%, 65%)',
    radius: '0.5rem',
  },
} as const;

export type OceanLightTheme = typeof oceanLight;
