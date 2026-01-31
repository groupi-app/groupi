/**
 * Groupi Dark Theme
 *
 * All design token values for the dark theme.
 * This is the single source of truth for token values.
 */

export const groupiDark = {
  // ==========================================================================
  // BRAND COLORS (Dark Mode - brighter for visibility)
  // ==========================================================================
  brand: {
    primary: 'hsl(285, 100%, 50%)',
    primaryHover: 'hsl(285, 100%, 58%)',
    primaryActive: 'hsl(285, 100%, 45%)',
    primarySubtle: 'hsl(285, 60%, 15%)',
    secondary: 'hsl(210, 100%, 60%)',
    secondaryHover: 'hsl(210, 100%, 68%)',
    accent: 'hsl(330, 100%, 65%)',
    accentHover: 'hsl(330, 100%, 72%)',
  },

  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode)
  // ==========================================================================
  background: {
    page: 'hsl(264, 71%, 6%)',
    surface: 'hsl(264, 50%, 10%)',
    elevated: 'hsl(264, 40%, 14%)',
    sunken: 'hsl(264, 80%, 4%)',
    overlay: 'hsl(0, 0%, 0%, 0.7)',
    interactive: 'hsl(264, 40%, 14%)',
    interactiveHover: 'hsl(264, 35%, 20%)',
    interactiveActive: 'hsl(264, 30%, 25%)',
    success: 'hsl(145, 80%, 35%)',
    successSubtle: 'hsl(145, 50%, 12%)',
    warning: 'hsl(35, 100%, 45%)',
    warningSubtle: 'hsl(35, 50%, 12%)',
    error: 'hsl(0, 70%, 45%)',
    errorSubtle: 'hsl(0, 50%, 12%)',
    info: 'hsl(210, 100%, 45%)',
    infoSubtle: 'hsl(210, 50%, 12%)',
  },

  // ==========================================================================
  // TEXT COLORS (Dark Mode - higher contrast)
  // ==========================================================================
  text: {
    primary: 'hsl(213, 31%, 91%)',
    secondary: 'hsl(215, 20%, 65%)',
    tertiary: 'hsl(215, 16%, 55%)',
    muted: 'hsl(215.4, 16.3%, 56.9%)',
    disabled: 'hsl(215, 14%, 40%)',
    heading: 'hsl(213, 31%, 95%)',
    body: 'hsl(213, 31%, 91%)',
    caption: 'hsl(215, 20%, 65%)',
    onPrimary: 'hsl(0, 0%, 100%)',
    onSurface: 'hsl(213, 31%, 91%)',
    onError: 'hsl(0, 0%, 100%)',
    link: 'hsl(285, 100%, 70%)',
    linkHover: 'hsl(285, 100%, 80%)',
    success: 'hsl(145, 80%, 55%)',
    warning: 'hsl(35, 100%, 60%)',
    error: 'hsl(0, 70%, 60%)',
  },

  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: 'hsl(216, 34%, 17%)',
    strong: 'hsl(216, 30%, 25%)',
    subtle: 'hsl(216, 40%, 12%)',
    focus: 'hsl(285, 100%, 50%)',
    error: 'hsl(0, 70%, 45%)',
    success: 'hsl(145, 80%, 35%)',
  },

  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: 'hsl(285, 100%, 50%, 0.5)',
    selection: 'hsl(285, 100%, 50%, 0.2)',
    highlight: 'hsl(45, 100%, 50%, 0.15)',
  },

  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - slightly brighter)
  // ==========================================================================
  fun: {
    celebration: 'hsl(45, 100%, 55%)',
    achievement: 'hsl(145, 80%, 50%)',
    streak: 'hsl(25, 100%, 60%)',
    party: 'hsl(330, 100%, 65%)',
  },

  // ==========================================================================
  // SHADOWS (Dark Mode - more subtle, higher opacity)
  // ==========================================================================
  shadow: {
    raised: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    floating:
      '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    overlay:
      '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    popup: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    pop: '0 4px 0 0 rgb(0 0 0 / 0.3)',
    glow: '0 0 20px 0 hsl(285 100% 50% / 0.4)',
    bounce: '0 2px 0 0 rgb(0 0 0 / 0.3)',
  },

  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: 'hsl(264, 71%, 6%)',
    foreground: 'hsl(213, 31%, 91%)',
    muted: 'hsl(223, 47%, 11%)',
    mutedForeground: 'hsl(215.4, 16.3%, 56.9%)',
    popover: 'hsl(264, 71%, 6%)',
    popoverForeground: 'hsl(215, 20.2%, 65.1%)',
    card: 'hsl(264, 71%, 6%)',
    cardForeground: 'hsl(213, 31%, 91%)',
    border: 'hsl(216, 34%, 17%)',
    input: 'hsl(216, 34%, 17%)',
    primary: 'hsl(285, 100%, 50%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(222.2, 47.4%, 11.2%)',
    secondaryForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(273, 34%, 16%)',
    accentForeground: 'hsl(260, 40%, 98%)',
    destructive: 'hsl(0, 63%, 45%)',
    destructiveForeground: 'hsl(210, 40%, 98%)',
    ring: 'hsl(285, 100%, 50%)',
    radius: '0.5rem',
  },
} as const;

export type GroupiDarkTheme = typeof groupiDark;
