'use strict';

// src/design/themes/groupi-light.ts
var groupiLight = {
  // ==========================================================================
  // BRAND COLORS
  // ==========================================================================
  brand: {
    primary: "hsl(285, 100%, 34%)",
    primaryHover: "hsl(285, 100%, 28%)",
    primaryActive: "hsl(285, 100%, 24%)",
    primarySubtle: "hsl(285, 100%, 94%)",
    secondary: "hsl(210, 100%, 50%)",
    secondaryHover: "hsl(210, 100%, 42%)",
    accent: "hsl(330, 100%, 60%)",
    accentHover: "hsl(330, 100%, 50%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS
  // ==========================================================================
  background: {
    page: "hsl(0, 0%, 100%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(220, 14%, 96%)",
    overlay: "hsl(0, 0%, 0%, 0.5)",
    interactive: "hsl(220, 14%, 96%)",
    interactiveHover: "hsl(220, 13%, 91%)",
    interactiveActive: "hsl(218, 12%, 83%)",
    success: "hsl(145, 80%, 45%)",
    successSubtle: "hsl(145, 80%, 90%)",
    warning: "hsl(35, 100%, 55%)",
    warningSubtle: "hsl(35, 100%, 90%)",
    error: "hsl(0, 85%, 55%)",
    errorSubtle: "hsl(0, 85%, 93%)",
    info: "hsl(210, 100%, 50%)",
    infoSubtle: "hsl(210, 100%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS
  // ==========================================================================
  text: {
    primary: "hsl(222.2, 47.4%, 11.2%)",
    secondary: "hsl(217, 9%, 40%)",
    tertiary: "hsl(217, 10%, 50%)",
    muted: "hsl(215.4, 16.3%, 46.9%)",
    disabled: "hsl(217, 10%, 65%)",
    heading: "hsl(222.2, 47.4%, 11.2%)",
    body: "hsl(222.2, 47.4%, 11.2%)",
    caption: "hsl(217, 9%, 40%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(222.2, 47.4%, 11.2%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(285, 100%, 34%)",
    linkHover: "hsl(285, 100%, 28%)",
    success: "hsl(145, 80%, 28%)",
    warning: "hsl(35, 100%, 36%)",
    error: "hsl(0, 85%, 46%)"
  },
  // ==========================================================================
  // BORDER COLORS
  // ==========================================================================
  border: {
    default: "hsl(214.3, 31.8%, 91.4%)",
    strong: "hsl(218, 12%, 83%)",
    subtle: "hsl(220, 13%, 95%)",
    focus: "hsl(285, 100%, 34%)",
    error: "hsl(0, 85%, 55%)",
    success: "hsl(145, 80%, 45%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(285, 100%, 34%, 0.4)",
    selection: "hsl(285, 100%, 34%, 0.15)",
    highlight: "hsl(45, 100%, 50%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Duolingo/Discord inspired)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 50%)",
    achievement: "hsl(145, 80%, 45%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(330, 100%, 60%)"
  },
  // ==========================================================================
  // SHADOWS
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.1)",
    glow: "0 0 20px 0 hsl(285 100% 34% / 0.3)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(0, 0%, 100%)",
    foreground: "hsl(222.2, 47.4%, 11.2%)",
    muted: "hsl(210, 40%, 96.1%)",
    mutedForeground: "hsl(215.4, 16.3%, 46.9%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(222.2, 47.4%, 11.2%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(222.2, 47.4%, 11.2%)",
    border: "hsl(214.3, 31.8%, 91.4%)",
    input: "hsl(214.3, 31.8%, 91.4%)",
    primary: "hsl(285, 100%, 34%)",
    primaryForeground: "hsl(210, 40%, 98%)",
    secondary: "hsl(210, 40%, 96.1%)",
    secondaryForeground: "hsl(222.2, 47.4%, 11.2%)",
    accent: "hsl(260, 40%, 96.1%)",
    accentForeground: "hsl(273.2, 47.4%, 11.2%)",
    destructive: "hsl(0, 85%, 55%)",
    destructiveForeground: "hsl(210, 40%, 98%)",
    ring: "hsl(215, 20.2%, 65.1%)",
    radius: "0.5rem"
  }
};
var sharedTokens = {
  // Spacing - Inset (padding)
  spacing: {
    inset: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem",
      // 24px
      xl: "2rem",
      // 32px
      "2xl": "3rem"
      // 48px
    },
    stack: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem",
      // 24px
      xl: "2rem",
      // 32px
      section: "3rem"
      // 48px
    },
    inline: {
      xs: "0.25rem",
      // 4px
      sm: "0.5rem",
      // 8px
      md: "1rem",
      // 16px
      lg: "1.5rem"
      // 24px
    },
    layout: {
      pageMargin: "1rem",
      sectionGap: "3rem",
      containerPadding: "2rem"
    }
  },
  // Border Radius - Dramatically Rounded (Duolingo style)
  radius: {
    shape: {
      subtle: "0.5rem",
      // 8px - standard
      soft: "1rem",
      // 16px - cards, containers
      rounded: "1.25rem",
      // 20px - modals, large elements
      pill: "9999px"
      // Pill shape
    },
    component: {
      button: "1rem",
      // 16px - very rounded like Duolingo
      card: "1.25rem",
      // 20px - friendly, approachable
      input: "0.75rem",
      // 12px - rounded inputs
      badge: "9999px",
      // Pill-shaped badges
      avatar: "50%",
      // Circular avatars
      modal: "1.5rem",
      // 24px - very soft modals
      tooltip: "0.75rem",
      // 12px
      dropdown: "1rem",
      // 16px
      sheet: "1.5rem"
      // 24px - top corners for sheets
    }
  },
  // Animation Duration
  duration: {
    instant: "0ms",
    micro: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms"
  },
  // Animation Easing
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  // Z-Index
  // Local stacking: Use for relative positioning within components (1-3)
  // Global stacking: Use for overlays, modals, etc. (40+)
  // Note: dropdown > popover because dropdowns often open from inside popovers
  zIndex: {
    // Local stacking (within components)
    lifted: 1,
    // Slightly above siblings
    float: 2,
    // Floating above local content
    top: 3,
    // Topmost in local context
    // Global stacking (overlays, fixed elements)
    base: 0,
    sticky: 40,
    popover: 50,
    dropdown: 60,
    modal: 70,
    toast: 80,
    tooltip: 90,
    overlay: 100
  },
  // Typography
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      mono: '"Fira Code", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
    },
    fontSize: {
      display: "3rem",
      h1: "2.25rem",
      h2: "1.875rem",
      h3: "1.5rem",
      h4: "1.25rem",
      bodyLg: "1.125rem",
      bodyMd: "1rem",
      bodySm: "0.875rem",
      bodyXs: "0.75rem",
      label: "0.875rem",
      button: "0.875rem",
      caption: "0.75rem",
      overline: "0.75rem",
      badge: "0.75rem"
    },
    lineHeight: {
      display: "1.1",
      h1: "1.2",
      h2: "1.3",
      h3: "1.4",
      h4: "1.4",
      bodyLg: "1.75",
      bodyMd: "1.5",
      bodySm: "1.5",
      bodyXs: "1.5",
      label: "1.5",
      button: "1.25",
      caption: "1.5",
      overline: "1.5",
      badge: "1"
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800"
    },
    letterSpacing: {
      display: "-0.02em",
      overline: "0.05em"
    }
  }
};

// src/design/themes/groupi-dark.ts
var groupiDark = {
  // ==========================================================================
  // BRAND COLORS (Dark Mode - brighter for visibility)
  // ==========================================================================
  brand: {
    primary: "hsl(285, 100%, 50%)",
    primaryHover: "hsl(285, 100%, 58%)",
    primaryActive: "hsl(285, 100%, 45%)",
    primarySubtle: "hsl(285, 60%, 15%)",
    secondary: "hsl(210, 100%, 60%)",
    secondaryHover: "hsl(210, 100%, 68%)",
    accent: "hsl(330, 100%, 65%)",
    accentHover: "hsl(330, 100%, 72%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode)
  // ==========================================================================
  background: {
    page: "hsl(264, 71%, 6%)",
    surface: "hsl(264, 50%, 10%)",
    elevated: "hsl(264, 40%, 14%)",
    sunken: "hsl(264, 80%, 4%)",
    overlay: "hsl(0, 0%, 0%, 0.7)",
    interactive: "hsl(264, 40%, 14%)",
    interactiveHover: "hsl(264, 35%, 20%)",
    interactiveActive: "hsl(264, 30%, 25%)",
    success: "hsl(145, 80%, 35%)",
    successSubtle: "hsl(145, 50%, 12%)",
    warning: "hsl(35, 100%, 45%)",
    warningSubtle: "hsl(35, 50%, 12%)",
    error: "hsl(0, 70%, 45%)",
    errorSubtle: "hsl(0, 50%, 12%)",
    info: "hsl(210, 100%, 45%)",
    infoSubtle: "hsl(210, 50%, 12%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - higher contrast)
  // ==========================================================================
  text: {
    primary: "hsl(213, 31%, 91%)",
    secondary: "hsl(215, 20%, 65%)",
    tertiary: "hsl(215, 16%, 55%)",
    muted: "hsl(215.4, 16.3%, 56.9%)",
    disabled: "hsl(215, 14%, 40%)",
    heading: "hsl(213, 31%, 95%)",
    body: "hsl(213, 31%, 91%)",
    caption: "hsl(215, 20%, 65%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(213, 31%, 91%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(285, 100%, 70%)",
    linkHover: "hsl(285, 100%, 80%)",
    success: "hsl(145, 80%, 55%)",
    warning: "hsl(35, 100%, 60%)",
    error: "hsl(0, 70%, 60%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(216, 34%, 17%)",
    strong: "hsl(216, 30%, 25%)",
    subtle: "hsl(216, 40%, 12%)",
    focus: "hsl(285, 100%, 50%)",
    error: "hsl(0, 70%, 45%)",
    success: "hsl(145, 80%, 35%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(285, 100%, 50%, 0.5)",
    selection: "hsl(285, 100%, 50%, 0.2)",
    highlight: "hsl(45, 100%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - slightly brighter)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 55%)",
    achievement: "hsl(145, 80%, 50%)",
    streak: "hsl(25, 100%, 60%)",
    party: "hsl(330, 100%, 65%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - more subtle, higher opacity)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.3)",
    glow: "0 0 20px 0 hsl(285 100% 50% / 0.4)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.3)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(264, 71%, 6%)",
    foreground: "hsl(213, 31%, 91%)",
    muted: "hsl(223, 47%, 11%)",
    mutedForeground: "hsl(215.4, 16.3%, 56.9%)",
    popover: "hsl(264, 71%, 6%)",
    popoverForeground: "hsl(215, 20.2%, 65.1%)",
    card: "hsl(264, 71%, 6%)",
    cardForeground: "hsl(213, 31%, 91%)",
    border: "hsl(216, 34%, 17%)",
    input: "hsl(216, 34%, 17%)",
    primary: "hsl(285, 100%, 50%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(222.2, 47.4%, 11.2%)",
    secondaryForeground: "hsl(210, 40%, 98%)",
    accent: "hsl(273, 34%, 16%)",
    accentForeground: "hsl(260, 40%, 98%)",
    destructive: "hsl(0, 63%, 45%)",
    destructiveForeground: "hsl(210, 40%, 98%)",
    ring: "hsl(285, 100%, 50%)",
    radius: "0.5rem"
  }
};

// src/design/themes/index.ts
var themes = {
  light: groupiLight,
  dark: groupiDark
};
var tokens = sharedTokens;

exports.groupiDark = groupiDark;
exports.groupiLight = groupiLight;
exports.sharedTokens = sharedTokens;
exports.themes = themes;
exports.tokens = tokens;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map