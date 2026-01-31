/**
 * Groupi Dark Theme
 *
 * All design token values for the dark theme.
 * This is the single source of truth for token values.
 */

export const groupiDark = {
  // ==========================================================================
  // BRAND COLORS (Dark Mode - refined for dark backgrounds)
  // ==========================================================================
  brand: {
    primary: 'hsl(280, 85%, 60%)', // Softened purple, still vibrant
    primaryHover: 'hsl(280, 85%, 68%)',
    primaryActive: 'hsl(280, 85%, 52%)',
    primarySubtle: 'hsl(280, 40%, 15%)',
    secondary: 'hsl(210, 90%, 62%)',
    secondaryHover: 'hsl(210, 90%, 70%)',
    accent: 'hsl(330, 85%, 62%)', // Pink accent
    accentHover: 'hsl(330, 85%, 70%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Rich Purple Dark - matches Ocean's color relationship)
  // Saturated violet (hue 270, 35-50% sat) complements purple primary (hue 280)
  // ==========================================================================
  background: {
    page: 'hsl(270, 45%, 7%)', // Deep rich purple
    surface: 'hsl(270, 40%, 11%)', // Cards, containers
    elevated: 'hsl(270, 35%, 15%)', // Popovers, dropdowns
    sunken: 'hsl(270, 50%, 5%)', // Recessed areas
    overlay: 'hsla(270, 45%, 4%, 0.85)',
    interactive: 'hsl(270, 38%, 13%)',
    interactiveHover: 'hsl(270, 35%, 19%)',
    interactiveActive: 'hsl(270, 32%, 23%)',
    success: 'hsl(145, 70%, 38%)',
    successSubtle: 'hsl(145, 40%, 14%)',
    warning: 'hsl(38, 92%, 50%)',
    warningSubtle: 'hsl(38, 40%, 14%)',
    error: 'hsl(0, 65%, 50%)',
    errorSubtle: 'hsl(0, 40%, 14%)',
    info: 'hsl(210, 90%, 52%)',
    infoSubtle: 'hsl(210, 40%, 14%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast with purple tint)
  // ==========================================================================
  text: {
    primary: 'hsl(270, 20%, 94%)', // Warm white with purple tint
    secondary: 'hsl(270, 18%, 72%)', // Softer secondary text
    tertiary: 'hsl(270, 15%, 60%)',
    muted: 'hsl(270, 15%, 55%)',
    disabled: 'hsl(270, 12%, 40%)',
    heading: 'hsl(270, 25%, 97%)', // Crisp headings
    body: 'hsl(270, 20%, 92%)',
    caption: 'hsl(270, 18%, 68%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(0, 0%, 95%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(280, 85%, 70%)', // Matches softened primary
    linkHover: 'hsl(280, 85%, 78%)',
    success: 'hsl(145, 70%, 58%)',
    warning: 'hsl(38, 92%, 62%)',
    error: 'hsl(0, 65%, 62%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode - rich purple to match backgrounds)
  // ==========================================================================
  border: {
    default: 'hsl(270, 30%, 20%)', // Visible purple borders
    strong: 'hsl(270, 28%, 28%)',
    subtle: 'hsl(270, 35%, 14%)',
    focus: 'hsl(280, 85%, 60%)',
    error: 'hsl(0, 65%, 50%)',
    success: 'hsl(145, 70%, 38%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(280, 85%, 60%, 0.5)',
    selection: 'hsl(280, 85%, 60%, 0.25)',
    highlight: 'hsl(45, 100%, 50%, 0.12)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - vibrant)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 58%)',
    achievement: 'hsl(145, 70%, 52%)',
    streak: 'hsl(25, 95%, 58%)',
    party: 'hsl(330, 85%, 62%)',
  },

  // ==========================================================================
  // SHADOWS (Dark Mode - deeper shadows for depth)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    pop: '0 4px 0 0 rgb(0 0 0 / 0.4)',
    glow: '0 0 20px 0 hsl(280 85% 60% / 0.35)',
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.4)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(270, 45%, 7%)',
    foreground: 'hsl(270, 20%, 94%)',
    muted: 'hsl(270, 38%, 13%)',
    mutedForeground: 'hsl(270, 15%, 55%)',
    popover: 'hsl(270, 35%, 15%)',
    popoverForeground: 'hsl(270, 18%, 72%)',
    card: 'hsl(270, 40%, 11%)',
    cardForeground: 'hsl(270, 20%, 94%)',
    border: 'hsl(270, 30%, 20%)',
    input: 'hsl(270, 30%, 20%)',
    primary: 'hsl(280, 85%, 60%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(270, 38%, 13%)',
    secondaryForeground: 'hsl(270, 20%, 94%)',
    accent: 'hsl(280, 35%, 18%)',
    accentForeground: 'hsl(280, 25%, 95%)',
    destructive: 'hsl(0, 65%, 50%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    ring: 'hsl(280, 85%, 60%)',
    radius: '0.5rem',
  },
} as const;

export type GroupiDarkTheme = typeof groupiDark;
