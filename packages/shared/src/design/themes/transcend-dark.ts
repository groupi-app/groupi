/**
 * Transcend Dark Theme
 *
 * A trans pride inspired dark theme using the official trans flag colors.
 * Pink: #F5A9B8, Blue: #5BCEFA
 */

import type { ThemeTokens } from './types';

export const transcendDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // ==========================================================================
  brand: {
    primary: 'hsl(348, 79%, 81%)', // Trans pink #F5A9B8
    primaryHover: 'hsl(348, 79%, 88%)',
    primaryActive: 'hsl(348, 79%, 75%)',
    primarySubtle: 'hsl(348, 50%, 20%)',
    secondary: 'hsl(197, 94%, 67%)', // Trans blue #5BCEFA
    secondaryHover: 'hsl(197, 94%, 75%)',
    accent: 'hsl(197, 94%, 67%)', // Trans blue as accent
    accentHover: 'hsl(197, 94%, 75%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purple with blue/pink tints)
  // ==========================================================================
  background: {
    page: 'hsl(260, 25%, 10%)', // Deep purple-black
    surface: 'hsl(260, 22%, 14%)', // Slightly lifted
    elevated: 'hsl(260, 20%, 18%)', // Popovers, dropdowns
    sunken: 'hsl(260, 30%, 7%)',
    overlay: 'hsl(260, 25%, 6%, 0.9)',
    interactive: 'hsl(197, 40%, 15%)', // Blue-tinted interactive
    interactiveHover: 'hsl(197, 45%, 20%)',
    interactiveActive: 'hsl(197, 50%, 25%)',
    success: 'hsl(160, 70%, 38%)',
    successSubtle: 'hsl(160, 40%, 14%)',
    warning: 'hsl(38, 90%, 48%)',
    warningSubtle: 'hsl(38, 40%, 14%)',
    error: 'hsl(0, 70%, 50%)',
    errorSubtle: 'hsl(0, 45%, 14%)',
    info: 'hsl(197, 94%, 50%)', // Trans blue
    infoSubtle: 'hsl(197, 60%, 16%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - with blue accents)
  // ==========================================================================
  text: {
    primary: 'hsl(197, 30%, 95%)', // Slight blue tint
    secondary: 'hsl(197, 25%, 75%)', // Blue-tinted secondary
    tertiary: 'hsl(260, 15%, 62%)',
    muted: 'hsl(260, 15%, 55%)',
    disabled: 'hsl(260, 10%, 40%)',
    heading: 'hsl(197, 40%, 97%)', // Blue-tinted headings
    body: 'hsl(197, 30%, 93%)',
    caption: 'hsl(197, 25%, 70%)',
    onPrimary: 'hsl(260, 30%, 15%)', // Dark text on pink
    onSurface: 'hsl(197, 30%, 95%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(197, 94%, 72%)', // Bright blue links
    linkHover: 'hsl(197, 94%, 80%)',
    success: 'hsl(160, 70%, 55%)',
    warning: 'hsl(38, 90%, 62%)',
    error: 'hsl(0, 70%, 62%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode - blue accented)
  // ==========================================================================
  border: {
    default: 'hsl(197, 30%, 25%)', // Blue-tinted borders
    strong: 'hsl(197, 35%, 35%)',
    subtle: 'hsl(260, 20%, 18%)',
    focus: 'hsl(197, 94%, 67%)', // Trans blue focus
    error: 'hsl(0, 70%, 50%)',
    success: 'hsl(160, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: 'hsl(197, 94%, 67%, 0.6)', // Blue focus ring
    selection: 'hsl(197, 94%, 67%, 0.3)', // Blue selection
    highlight: 'hsl(348, 79%, 81%, 0.2)', // Pink highlight
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: 'hsl(197, 94%, 67%)', // Trans Blue
    achievement: 'hsl(160, 80%, 52%)',
    streak: 'hsl(348, 79%, 81%)', // Trans Pink
    party: 'hsl(348, 79%, 81%)', // Trans Pink
  },

  // ==========================================================================
  // SHADOWS (Dark Mode - blue glow)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
    pop: '0 4px 0 0 hsl(197 80% 40% / 0.5)', // Blue pop shadow
    glow: '0 0 30px 5px hsl(197 94% 67% / 0.4)', // Trans blue glow
    bounce: '0 2px 0 0 hsl(197 80% 40% / 0.5)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(260, 25%, 10%)',
    foreground: 'hsl(197, 30%, 95%)',
    muted: 'hsl(197, 40%, 15%)',
    mutedForeground: 'hsl(260, 15%, 55%)',
    popover: 'hsl(260, 20%, 18%)',
    popoverForeground: 'hsl(197, 25%, 75%)',
    card: 'hsl(260, 22%, 14%)',
    cardForeground: 'hsl(197, 30%, 95%)',
    border: 'hsl(197, 30%, 25%)',
    input: 'hsl(197, 30%, 25%)',
    primary: 'hsl(348, 79%, 81%)', // Trans pink #F5A9B8
    primaryForeground: 'hsl(260, 30%, 15%)',
    secondary: 'hsl(197, 40%, 15%)', // Blue secondary background
    secondaryForeground: 'hsl(197, 94%, 75%)', // Bright blue text
    accent: 'hsl(197, 50%, 18%)', // Blue accent background
    accentForeground: 'hsl(197, 94%, 75%)', // Bright blue text
    destructive: 'hsl(0, 70%, 50%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(197, 94%, 67%)', // Trans blue ring
    radius: '0.5rem',
  },
} as const;

export type TranscendDarkTheme = typeof transcendDark;
