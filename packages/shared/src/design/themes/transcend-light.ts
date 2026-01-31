/**
 * Transcend Light Theme
 *
 * A trans pride inspired light theme using the official trans flag colors.
 * Pink: #F5A9B8, Blue: #5BCEFA
 */

import type { ThemeTokens } from './types';

export const transcendLight: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // For light mode, we use slightly darker versions for better contrast
  // ==========================================================================
  brand: {
    primary: 'hsl(348, 70%, 65%)', // Darker pink for contrast
    primaryHover: 'hsl(348, 70%, 58%)',
    primaryActive: 'hsl(348, 70%, 52%)',
    primarySubtle: 'hsl(348, 79%, 92%)', // Very soft pink
    secondary: 'hsl(197, 80%, 50%)', // Darker blue for contrast
    secondaryHover: 'hsl(197, 80%, 45%)',
    accent: 'hsl(197, 80%, 50%)', // Trans blue as accent
    accentHover: 'hsl(197, 80%, 45%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft pinks and whites with blue tints)
  // ==========================================================================
  background: {
    page: 'hsl(348, 50%, 98%)', // Very soft pink-white
    surface: 'hsl(0, 0%, 100%)', // Pure white cards
    elevated: 'hsl(0, 0%, 100%)', // White elevated
    sunken: 'hsl(348, 40%, 95%)', // Soft pink sunken
    overlay: 'hsl(260, 25%, 10%, 0.6)',
    interactive: 'hsl(197, 50%, 95%)', // Blue-tinted interactive
    interactiveHover: 'hsl(197, 55%, 90%)',
    interactiveActive: 'hsl(197, 60%, 85%)',
    success: 'hsl(160, 70%, 38%)',
    successSubtle: 'hsl(160, 50%, 92%)',
    warning: 'hsl(38, 90%, 50%)',
    warningSubtle: 'hsl(38, 70%, 92%)',
    error: 'hsl(0, 70%, 50%)',
    errorSubtle: 'hsl(0, 60%, 94%)',
    info: 'hsl(197, 80%, 50%)', // Trans blue
    infoSubtle: 'hsl(197, 70%, 92%)',
  },

  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: 'hsl(260, 30%, 15%)', // Deep purple-black
    secondary: 'hsl(260, 20%, 35%)',
    tertiary: 'hsl(260, 15%, 50%)',
    muted: 'hsl(260, 12%, 55%)',
    disabled: 'hsl(260, 8%, 65%)',
    heading: 'hsl(260, 35%, 12%)',
    body: 'hsl(260, 25%, 18%)',
    caption: 'hsl(260, 15%, 45%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(260, 30%, 15%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(197, 80%, 40%)', // Blue links
    linkHover: 'hsl(197, 80%, 32%)',
    success: 'hsl(160, 70%, 30%)',
    warning: 'hsl(38, 90%, 35%)',
    error: 'hsl(0, 70%, 45%)',
  },

  // ==========================================================================
  // BORDER COLORS (Light Mode - blue accented)
  // ==========================================================================
  border: {
    default: 'hsl(197, 30%, 82%)', // Blue-tinted borders
    strong: 'hsl(197, 35%, 70%)',
    subtle: 'hsl(348, 30%, 90%)', // Pink-tinted subtle
    focus: 'hsl(197, 80%, 50%)', // Blue focus
    error: 'hsl(0, 70%, 50%)',
    success: 'hsl(160, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Light Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: 'hsl(197, 80%, 50%, 0.5)', // Blue focus ring
    selection: 'hsl(197, 94%, 67%, 0.2)', // Blue selection
    highlight: 'hsl(348, 79%, 81%, 0.2)', // Pink highlight
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: 'hsl(197, 94%, 67%)', // Trans Blue #5BCEFA
    achievement: 'hsl(160, 80%, 45%)',
    streak: 'hsl(348, 79%, 81%)', // Trans Pink #F5A9B8
    party: 'hsl(348, 79%, 81%)', // Trans Pink #F5A9B8
  },

  // ==========================================================================
  // SHADOWS (Light Mode - pink glow)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    pop: '0 4px 0 0 hsl(348 60% 75% / 0.4)', // Pink pop shadow
    glow: '0 0 25px 3px hsl(348 79% 81% / 0.35)', // Trans pink glow
    bounce: '0 2px 0 0 hsl(348 60% 75% / 0.4)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(348, 50%, 98%)',
    foreground: 'hsl(260, 30%, 15%)',
    muted: 'hsl(197, 50%, 95%)',
    mutedForeground: 'hsl(260, 12%, 55%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(260, 20%, 35%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(260, 30%, 15%)',
    border: 'hsl(197, 30%, 82%)',
    input: 'hsl(197, 30%, 82%)',
    primary: 'hsl(348, 70%, 65%)', // Pink primary
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(197, 50%, 95%)', // Blue secondary background
    secondaryForeground: 'hsl(197, 80%, 40%)', // Blue text
    accent: 'hsl(197, 55%, 92%)', // Blue accent background
    accentForeground: 'hsl(197, 80%, 40%)', // Blue text
    destructive: 'hsl(0, 70%, 50%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(197, 80%, 50%)', // Blue ring
    radius: '0.5rem',
  },
} as const;

export type TranscendLightTheme = typeof transcendLight;
