/**
 * OLED Dark Theme
 *
 * True black backgrounds optimized for OLED screens.
 * Pure blacks (#000) save battery and provide stunning contrast.
 * Vibrant accents pop beautifully against the deep black.
 */

import type { ThemeTokens } from './types';

export const oledDark: ThemeTokens = {
  // ==========================================================================
  // BRAND COLORS - Extra vibrant for contrast against pure black
  // ==========================================================================
  brand: {
    primary: 'hsl(280, 90%, 65%)', // Vibrant purple
    primaryHover: 'hsl(280, 90%, 72%)',
    primaryActive: 'hsl(280, 90%, 58%)',
    primarySubtle: 'hsl(280, 50%, 12%)',
    secondary: 'hsl(210, 95%, 65%)',
    secondaryHover: 'hsl(210, 95%, 72%)',
    accent: 'hsl(330, 90%, 65%)', // Hot pink accent
    accentHover: 'hsl(330, 90%, 72%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (True Black for OLED)
  // Pure black page, minimal elevation differences using transparency
  // ==========================================================================
  background: {
    page: 'hsl(0, 0%, 0%)', // True black
    surface: 'hsl(0, 0%, 6%)', // Barely lifted
    elevated: 'hsl(0, 0%, 10%)', // Popovers, dropdowns
    sunken: 'hsl(0, 0%, 0%)', // Same as page
    overlay: 'hsla(0, 0%, 0%, 0.85)',
    interactive: 'hsl(0, 0%, 8%)',
    interactiveHover: 'hsl(0, 0%, 14%)',
    interactiveActive: 'hsl(0, 0%, 18%)',
    success: 'hsl(145, 75%, 40%)',
    successSubtle: 'hsl(145, 50%, 10%)',
    warning: 'hsl(38, 95%, 52%)',
    warningSubtle: 'hsl(38, 50%, 10%)',
    error: 'hsl(0, 70%, 52%)',
    errorSubtle: 'hsl(0, 50%, 10%)',
    info: 'hsl(210, 95%, 55%)',
    infoSubtle: 'hsl(210, 50%, 10%)',
  },

  // ==========================================================================
  // TEXT COLORS (Maximum contrast for OLED)
  // ==========================================================================
  text: {
    primary: 'hsl(0, 0%, 98%)', // Almost pure white
    secondary: 'hsl(0, 0%, 72%)',
    tertiary: 'hsl(0, 0%, 58%)',
    muted: 'hsl(0, 0%, 50%)',
    disabled: 'hsl(0, 0%, 35%)',
    heading: 'hsl(0, 0%, 100%)', // Pure white headings
    body: 'hsl(0, 0%, 96%)',
    caption: 'hsl(0, 0%, 65%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(0, 0%, 98%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(280, 90%, 72%)',
    linkHover: 'hsl(280, 90%, 80%)',
    success: 'hsl(145, 75%, 60%)',
    warning: 'hsl(38, 95%, 65%)',
    error: 'hsl(0, 70%, 65%)',
  },

  // ==========================================================================
  // BORDER COLORS (Subtle on true black)
  // ==========================================================================
  border: {
    default: 'hsl(0, 0%, 16%)',
    strong: 'hsl(0, 0%, 24%)',
    subtle: 'hsl(0, 0%, 10%)',
    focus: 'hsl(280, 90%, 65%)',
    error: 'hsl(0, 70%, 52%)',
    success: 'hsl(145, 75%, 40%)',
  },

  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: 'hsl(280, 90%, 65%, 0.5)',
    selection: 'hsl(280, 90%, 65%, 0.3)',
    highlight: 'hsl(45, 100%, 50%, 0.15)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Extra vibrant on black)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 60%)',
    achievement: 'hsl(145, 75%, 55%)',
    streak: 'hsl(25, 100%, 60%)',
    party: 'hsl(330, 90%, 65%)',
  },

  // ==========================================================================
  // SHADOWS (Minimal - black on black doesn't need much)
  // Using colored glows for depth instead
  // ==========================================================================
  shadow: {
    raised: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    floating: '0 4px 8px -2px rgb(0 0 0 / 0.6)',
    overlay: '0 16px 32px -8px rgb(0 0 0 / 0.7)',
    popup: '0 8px 16px -4px rgb(0 0 0 / 0.6)',
    pop: '0 3px 0 0 rgb(0 0 0 / 0.5)',
    glow: '0 0 24px 0 hsl(280 90% 65% / 0.4)', // Purple glow
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.5)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(0, 0%, 0%)',
    foreground: 'hsl(0, 0%, 98%)',
    muted: 'hsl(0, 0%, 8%)',
    mutedForeground: 'hsl(0, 0%, 50%)',
    popover: 'hsl(0, 0%, 6%)',
    popoverForeground: 'hsl(0, 0%, 72%)',
    card: 'hsl(0, 0%, 6%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(0, 0%, 16%)',
    input: 'hsl(0, 0%, 16%)',
    primary: 'hsl(280, 90%, 65%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(0, 0%, 10%)',
    secondaryForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(280, 40%, 15%)',
    accentForeground: 'hsl(280, 40%, 95%)',
    destructive: 'hsl(0, 70%, 52%)',
    destructiveForeground: 'hsl(0, 0%, 100%)',
    ring: 'hsl(280, 90%, 65%)',
    radius: '0.5rem',
  },
} as const;

export type OledDarkTheme = typeof oledDark;
