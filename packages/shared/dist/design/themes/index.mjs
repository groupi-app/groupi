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
  // BRAND COLORS (Dark Mode - refined for dark backgrounds)
  // ==========================================================================
  brand: {
    primary: "hsl(280, 85%, 60%)",
    // Softened purple, still vibrant
    primaryHover: "hsl(280, 85%, 68%)",
    primaryActive: "hsl(280, 85%, 52%)",
    primarySubtle: "hsl(280, 40%, 15%)",
    secondary: "hsl(210, 90%, 62%)",
    secondaryHover: "hsl(210, 90%, 70%)",
    accent: "hsl(330, 85%, 62%)",
    // Pink accent
    accentHover: "hsl(330, 85%, 70%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Rich Purple Dark - matches Ocean's color relationship)
  // Saturated violet (hue 270, 35-50% sat) complements purple primary (hue 280)
  // ==========================================================================
  background: {
    page: "hsl(270, 45%, 7%)",
    // Deep rich purple
    surface: "hsl(270, 40%, 11%)",
    // Cards, containers
    elevated: "hsl(270, 35%, 15%)",
    // Popovers, dropdowns
    sunken: "hsl(270, 50%, 5%)",
    // Recessed areas
    overlay: "hsla(270, 45%, 4%, 0.85)",
    interactive: "hsl(270, 38%, 13%)",
    interactiveHover: "hsl(270, 35%, 19%)",
    interactiveActive: "hsl(270, 32%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(210, 90%, 52%)",
    infoSubtle: "hsl(210, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast with purple tint)
  // ==========================================================================
  text: {
    primary: "hsl(270, 20%, 94%)",
    // Warm white with purple tint
    secondary: "hsl(270, 18%, 72%)",
    // Softer secondary text
    tertiary: "hsl(270, 15%, 60%)",
    muted: "hsl(270, 15%, 55%)",
    disabled: "hsl(270, 12%, 40%)",
    heading: "hsl(270, 25%, 97%)",
    // Crisp headings
    body: "hsl(270, 20%, 92%)",
    caption: "hsl(270, 18%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(0, 0%, 95%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(280, 85%, 70%)",
    // Matches softened primary
    linkHover: "hsl(280, 85%, 78%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode - rich purple to match backgrounds)
  // ==========================================================================
  border: {
    default: "hsl(270, 30%, 20%)",
    // Visible purple borders
    strong: "hsl(270, 28%, 28%)",
    subtle: "hsl(270, 35%, 14%)",
    focus: "hsl(280, 85%, 60%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(280, 85%, 60%, 0.5)",
    selection: "hsl(280, 85%, 60%, 0.25)",
    highlight: "hsl(45, 100%, 50%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - vibrant)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 58%)",
    achievement: "hsl(145, 70%, 52%)",
    streak: "hsl(25, 95%, 58%)",
    party: "hsl(330, 85%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - deeper shadows for depth)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(280 85% 60% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(270, 45%, 7%)",
    foreground: "hsl(270, 20%, 94%)",
    muted: "hsl(270, 38%, 13%)",
    mutedForeground: "hsl(270, 15%, 55%)",
    popover: "hsl(270, 35%, 15%)",
    popoverForeground: "hsl(270, 18%, 72%)",
    card: "hsl(270, 40%, 11%)",
    cardForeground: "hsl(270, 20%, 94%)",
    border: "hsl(270, 30%, 20%)",
    input: "hsl(270, 30%, 20%)",
    primary: "hsl(280, 85%, 60%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(270, 38%, 13%)",
    secondaryForeground: "hsl(270, 20%, 94%)",
    accent: "hsl(280, 35%, 18%)",
    accentForeground: "hsl(280, 25%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(280, 85%, 60%)",
    radius: "0.5rem"
  }
};

// src/design/themes/oled-dark.ts
var oledDark = {
  // ==========================================================================
  // BRAND COLORS - Extra vibrant for contrast against pure black
  // ==========================================================================
  brand: {
    primary: "hsl(280, 90%, 65%)",
    // Vibrant purple
    primaryHover: "hsl(280, 90%, 72%)",
    primaryActive: "hsl(280, 90%, 58%)",
    primarySubtle: "hsl(280, 50%, 12%)",
    secondary: "hsl(210, 95%, 65%)",
    secondaryHover: "hsl(210, 95%, 72%)",
    accent: "hsl(330, 90%, 65%)",
    // Hot pink accent
    accentHover: "hsl(330, 90%, 72%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (True Black for OLED)
  // Pure black page, minimal elevation differences using transparency
  // ==========================================================================
  background: {
    page: "hsl(0, 0%, 0%)",
    // True black
    surface: "hsl(0, 0%, 6%)",
    // Barely lifted
    elevated: "hsl(0, 0%, 10%)",
    // Popovers, dropdowns
    sunken: "hsl(0, 0%, 0%)",
    // Same as page
    overlay: "hsla(0, 0%, 0%, 0.85)",
    interactive: "hsl(0, 0%, 8%)",
    interactiveHover: "hsl(0, 0%, 14%)",
    interactiveActive: "hsl(0, 0%, 18%)",
    success: "hsl(145, 75%, 40%)",
    successSubtle: "hsl(145, 50%, 10%)",
    warning: "hsl(38, 95%, 52%)",
    warningSubtle: "hsl(38, 50%, 10%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 50%, 10%)",
    info: "hsl(210, 95%, 55%)",
    infoSubtle: "hsl(210, 50%, 10%)"
  },
  // ==========================================================================
  // TEXT COLORS (Maximum contrast for OLED)
  // ==========================================================================
  text: {
    primary: "hsl(0, 0%, 98%)",
    // Almost pure white
    secondary: "hsl(0, 0%, 72%)",
    tertiary: "hsl(0, 0%, 58%)",
    muted: "hsl(0, 0%, 50%)",
    disabled: "hsl(0, 0%, 35%)",
    heading: "hsl(0, 0%, 100%)",
    // Pure white headings
    body: "hsl(0, 0%, 96%)",
    caption: "hsl(0, 0%, 65%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(0, 0%, 98%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(280, 90%, 72%)",
    linkHover: "hsl(280, 90%, 80%)",
    success: "hsl(145, 75%, 60%)",
    warning: "hsl(38, 95%, 65%)",
    error: "hsl(0, 70%, 65%)"
  },
  // ==========================================================================
  // BORDER COLORS (Subtle on true black)
  // ==========================================================================
  border: {
    default: "hsl(0, 0%, 16%)",
    strong: "hsl(0, 0%, 24%)",
    subtle: "hsl(0, 0%, 10%)",
    focus: "hsl(280, 90%, 65%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 75%, 40%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(280, 90%, 65%, 0.5)",
    selection: "hsl(280, 90%, 65%, 0.3)",
    highlight: "hsl(45, 100%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Extra vibrant on black)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 60%)",
    achievement: "hsl(145, 75%, 55%)",
    streak: "hsl(25, 100%, 60%)",
    party: "hsl(330, 90%, 65%)"
  },
  // ==========================================================================
  // SHADOWS (Minimal - black on black doesn't need much)
  // Using colored glows for depth instead
  // ==========================================================================
  shadow: {
    raised: "0 1px 2px 0 rgb(0 0 0 / 0.5)",
    floating: "0 4px 8px -2px rgb(0 0 0 / 0.6)",
    overlay: "0 16px 32px -8px rgb(0 0 0 / 0.7)",
    popup: "0 8px 16px -4px rgb(0 0 0 / 0.6)",
    pop: "0 3px 0 0 rgb(0 0 0 / 0.5)",
    glow: "0 0 24px 0 hsl(280 90% 65% / 0.4)",
    // Purple glow
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(0, 0%, 0%)",
    foreground: "hsl(0, 0%, 98%)",
    muted: "hsl(0, 0%, 8%)",
    mutedForeground: "hsl(0, 0%, 50%)",
    popover: "hsl(0, 0%, 6%)",
    popoverForeground: "hsl(0, 0%, 72%)",
    card: "hsl(0, 0%, 6%)",
    cardForeground: "hsl(0, 0%, 98%)",
    border: "hsl(0, 0%, 16%)",
    input: "hsl(0, 0%, 16%)",
    primary: "hsl(280, 90%, 65%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(0, 0%, 10%)",
    secondaryForeground: "hsl(0, 0%, 98%)",
    accent: "hsl(280, 40%, 15%)",
    accentForeground: "hsl(280, 40%, 95%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 100%)",
    ring: "hsl(280, 90%, 65%)",
    radius: "0.5rem"
  }
};

// src/design/themes/ocean-light.ts
var oceanLight = {
  // ==========================================================================
  // BRAND COLORS - Ocean blues
  // ==========================================================================
  brand: {
    primary: "hsl(200, 85%, 40%)",
    primaryHover: "hsl(200, 85%, 34%)",
    primaryActive: "hsl(200, 85%, 30%)",
    primarySubtle: "hsl(200, 85%, 94%)",
    secondary: "hsl(180, 70%, 40%)",
    secondaryHover: "hsl(180, 70%, 34%)",
    accent: "hsl(170, 80%, 45%)",
    accentHover: "hsl(170, 80%, 38%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS
  // ==========================================================================
  background: {
    page: "hsl(200, 30%, 99%)",
    surface: "hsl(200, 20%, 100%)",
    elevated: "hsl(200, 25%, 100%)",
    sunken: "hsl(200, 25%, 96%)",
    overlay: "hsl(200, 30%, 10%, 0.5)",
    interactive: "hsl(200, 20%, 96%)",
    interactiveHover: "hsl(200, 22%, 91%)",
    interactiveActive: "hsl(200, 18%, 85%)",
    success: "hsl(160, 75%, 42%)",
    successSubtle: "hsl(160, 75%, 92%)",
    warning: "hsl(38, 95%, 52%)",
    warningSubtle: "hsl(38, 95%, 92%)",
    error: "hsl(0, 75%, 55%)",
    errorSubtle: "hsl(0, 75%, 94%)",
    info: "hsl(200, 85%, 50%)",
    infoSubtle: "hsl(200, 85%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS
  // ==========================================================================
  text: {
    primary: "hsl(200, 35%, 15%)",
    secondary: "hsl(200, 20%, 40%)",
    tertiary: "hsl(200, 15%, 50%)",
    muted: "hsl(200, 12%, 50%)",
    disabled: "hsl(200, 10%, 65%)",
    heading: "hsl(200, 40%, 12%)",
    body: "hsl(200, 35%, 15%)",
    caption: "hsl(200, 20%, 40%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(200, 35%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(200, 85%, 40%)",
    linkHover: "hsl(200, 85%, 30%)",
    success: "hsl(160, 75%, 28%)",
    warning: "hsl(38, 95%, 36%)",
    error: "hsl(0, 75%, 46%)"
  },
  // ==========================================================================
  // BORDER COLORS
  // ==========================================================================
  border: {
    default: "hsl(200, 25%, 88%)",
    strong: "hsl(200, 20%, 78%)",
    subtle: "hsl(200, 30%, 94%)",
    focus: "hsl(200, 85%, 40%)",
    error: "hsl(0, 75%, 55%)",
    success: "hsl(160, 75%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS
  // ==========================================================================
  state: {
    focusRing: "hsl(200, 85%, 40%, 0.4)",
    selection: "hsl(200, 85%, 40%, 0.15)",
    highlight: "hsl(170, 80%, 45%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 50%)",
    achievement: "hsl(160, 75%, 42%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(170, 80%, 45%)"
  },
  // ==========================================================================
  // SHADOWS
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(200 30% 20% / 0.08), 0 1px 2px -1px hsl(200 30% 20% / 0.08)",
    floating: "0 4px 6px -1px hsl(200 30% 20% / 0.08), 0 2px 4px -2px hsl(200 30% 20% / 0.08)",
    overlay: "0 20px 25px -5px hsl(200 30% 20% / 0.1), 0 8px 10px -6px hsl(200 30% 20% / 0.08)",
    popup: "0 10px 15px -3px hsl(200 30% 20% / 0.08), 0 4px 6px -4px hsl(200 30% 20% / 0.08)",
    pop: "0 4px 0 0 hsl(200 30% 20% / 0.08)",
    glow: "0 0 20px 0 hsl(200 85% 40% / 0.3)",
    bounce: "0 2px 0 0 hsl(200 30% 20% / 0.08)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(200, 30%, 99%)",
    foreground: "hsl(200, 35%, 15%)",
    muted: "hsl(200, 25%, 96%)",
    mutedForeground: "hsl(200, 12%, 50%)",
    popover: "hsl(200, 20%, 100%)",
    popoverForeground: "hsl(200, 35%, 15%)",
    card: "hsl(200, 20%, 100%)",
    cardForeground: "hsl(200, 35%, 15%)",
    border: "hsl(200, 25%, 88%)",
    input: "hsl(200, 25%, 88%)",
    primary: "hsl(200, 85%, 40%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(200, 25%, 96%)",
    secondaryForeground: "hsl(200, 35%, 15%)",
    accent: "hsl(170, 30%, 95%)",
    accentForeground: "hsl(170, 40%, 15%)",
    destructive: "hsl(0, 75%, 55%)",
    destructiveForeground: "hsl(0, 0%, 100%)",
    ring: "hsl(200, 25%, 65%)",
    radius: "0.5rem"
  }
};

// src/design/themes/ocean-dark.ts
var oceanDark = {
  // ==========================================================================
  // BRAND COLORS - Bright ocean blues for dark mode
  // ==========================================================================
  brand: {
    primary: "hsl(200, 85%, 55%)",
    primaryHover: "hsl(200, 85%, 62%)",
    primaryActive: "hsl(200, 85%, 48%)",
    primarySubtle: "hsl(200, 60%, 15%)",
    secondary: "hsl(180, 70%, 50%)",
    secondaryHover: "hsl(180, 70%, 58%)",
    accent: "hsl(170, 80%, 50%)",
    accentHover: "hsl(170, 80%, 58%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep ocean blues)
  // ==========================================================================
  background: {
    page: "hsl(210, 50%, 6%)",
    surface: "hsl(210, 45%, 10%)",
    elevated: "hsl(210, 40%, 14%)",
    sunken: "hsl(210, 55%, 4%)",
    overlay: "hsl(210, 50%, 5%, 0.7)",
    interactive: "hsl(210, 40%, 14%)",
    interactiveHover: "hsl(210, 35%, 20%)",
    interactiveActive: "hsl(210, 30%, 25%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 50%, 12%)",
    warning: "hsl(38, 90%, 48%)",
    warningSubtle: "hsl(38, 50%, 12%)",
    error: "hsl(0, 65%, 48%)",
    errorSubtle: "hsl(0, 45%, 12%)",
    info: "hsl(200, 85%, 48%)",
    infoSubtle: "hsl(200, 50%, 12%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - high contrast)
  // ==========================================================================
  text: {
    primary: "hsl(200, 25%, 92%)",
    secondary: "hsl(200, 18%, 68%)",
    tertiary: "hsl(200, 14%, 58%)",
    muted: "hsl(200, 12%, 58%)",
    disabled: "hsl(200, 10%, 42%)",
    heading: "hsl(200, 30%, 96%)",
    body: "hsl(200, 25%, 92%)",
    caption: "hsl(200, 18%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(200, 25%, 92%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(200, 85%, 65%)",
    linkHover: "hsl(200, 85%, 75%)",
    success: "hsl(160, 70%, 55%)",
    warning: "hsl(38, 90%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(210, 35%, 18%)",
    strong: "hsl(210, 30%, 26%)",
    subtle: "hsl(210, 40%, 12%)",
    focus: "hsl(200, 85%, 55%)",
    error: "hsl(0, 65%, 48%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(200, 85%, 55%, 0.5)",
    selection: "hsl(200, 85%, 55%, 0.2)",
    highlight: "hsl(170, 80%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - brighter)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 55%)",
    achievement: "hsl(160, 70%, 50%)",
    streak: "hsl(25, 100%, 60%)",
    party: "hsl(170, 80%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - higher opacity)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(210 50% 5% / 0.3), 0 1px 2px -1px hsl(210 50% 5% / 0.3)",
    floating: "0 4px 6px -1px hsl(210 50% 5% / 0.4), 0 2px 4px -2px hsl(210 50% 5% / 0.3)",
    overlay: "0 20px 25px -5px hsl(210 50% 5% / 0.4), 0 8px 10px -6px hsl(210 50% 5% / 0.3)",
    popup: "0 10px 15px -3px hsl(210 50% 5% / 0.4), 0 4px 6px -4px hsl(210 50% 5% / 0.3)",
    pop: "0 4px 0 0 hsl(210 50% 5% / 0.3)",
    glow: "0 0 20px 0 hsl(200 85% 55% / 0.4)",
    bounce: "0 2px 0 0 hsl(210 50% 5% / 0.3)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(210, 50%, 6%)",
    foreground: "hsl(200, 25%, 92%)",
    muted: "hsl(210, 40%, 12%)",
    mutedForeground: "hsl(200, 12%, 58%)",
    popover: "hsl(210, 50%, 6%)",
    popoverForeground: "hsl(200, 18%, 68%)",
    card: "hsl(210, 50%, 6%)",
    cardForeground: "hsl(200, 25%, 92%)",
    border: "hsl(210, 35%, 18%)",
    input: "hsl(210, 35%, 18%)",
    primary: "hsl(200, 85%, 55%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(210, 40%, 14%)",
    secondaryForeground: "hsl(0, 0%, 98%)",
    accent: "hsl(200, 35%, 16%)",
    accentForeground: "hsl(170, 40%, 95%)",
    destructive: "hsl(0, 60%, 48%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(200, 85%, 55%)",
    radius: "0.5rem"
  }
};

// src/design/themes/transcend-light.ts
var transcendLight = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // For light mode, we use slightly darker versions for better contrast
  // ==========================================================================
  brand: {
    primary: "hsl(348, 70%, 65%)",
    // Darker pink for contrast
    primaryHover: "hsl(348, 70%, 58%)",
    primaryActive: "hsl(348, 70%, 52%)",
    primarySubtle: "hsl(348, 79%, 92%)",
    // Very soft pink
    secondary: "hsl(197, 80%, 50%)",
    // Darker blue for contrast
    secondaryHover: "hsl(197, 80%, 45%)",
    accent: "hsl(197, 80%, 50%)",
    // Trans blue as accent
    accentHover: "hsl(197, 80%, 45%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft pinks and whites with blue tints)
  // ==========================================================================
  background: {
    page: "hsl(348, 50%, 98%)",
    // Very soft pink-white
    surface: "hsl(0, 0%, 100%)",
    // Pure white cards
    elevated: "hsl(0, 0%, 100%)",
    // White elevated
    sunken: "hsl(348, 40%, 95%)",
    // Soft pink sunken
    overlay: "hsl(260, 25%, 10%, 0.6)",
    interactive: "hsl(197, 50%, 95%)",
    // Blue-tinted interactive
    interactiveHover: "hsl(197, 55%, 90%)",
    interactiveActive: "hsl(197, 60%, 85%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 50%, 92%)",
    warning: "hsl(38, 90%, 50%)",
    warningSubtle: "hsl(38, 70%, 92%)",
    error: "hsl(0, 70%, 50%)",
    errorSubtle: "hsl(0, 60%, 94%)",
    info: "hsl(197, 80%, 50%)",
    // Trans blue
    infoSubtle: "hsl(197, 70%, 92%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(260, 30%, 15%)",
    // Deep purple-black
    secondary: "hsl(260, 20%, 35%)",
    tertiary: "hsl(260, 15%, 50%)",
    muted: "hsl(260, 12%, 55%)",
    disabled: "hsl(260, 8%, 65%)",
    heading: "hsl(260, 35%, 12%)",
    body: "hsl(260, 25%, 18%)",
    caption: "hsl(260, 15%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(260, 30%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(197, 80%, 40%)",
    // Blue links
    linkHover: "hsl(197, 80%, 32%)",
    success: "hsl(160, 70%, 30%)",
    warning: "hsl(38, 90%, 35%)",
    error: "hsl(0, 70%, 45%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode - blue accented)
  // ==========================================================================
  border: {
    default: "hsl(197, 30%, 82%)",
    // Blue-tinted borders
    strong: "hsl(197, 35%, 70%)",
    subtle: "hsl(348, 30%, 90%)",
    // Pink-tinted subtle
    focus: "hsl(197, 80%, 50%)",
    // Blue focus
    error: "hsl(0, 70%, 50%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: "hsl(197, 80%, 50%, 0.5)",
    // Blue focus ring
    selection: "hsl(197, 94%, 67%, 0.2)",
    // Blue selection
    highlight: "hsl(348, 79%, 81%, 0.2)"
    // Pink highlight
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: "hsl(197, 94%, 67%)",
    // Trans Blue #5BCEFA
    achievement: "hsl(160, 80%, 45%)",
    streak: "hsl(348, 79%, 81%)",
    // Trans Pink #F5A9B8
    party: "hsl(348, 79%, 81%)"
    // Trans Pink #F5A9B8
  },
  // ==========================================================================
  // SHADOWS (Light Mode - pink glow)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    pop: "0 4px 0 0 hsl(348 60% 75% / 0.4)",
    // Pink pop shadow
    glow: "0 0 25px 3px hsl(348 79% 81% / 0.35)",
    // Trans pink glow
    bounce: "0 2px 0 0 hsl(348 60% 75% / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(348, 50%, 98%)",
    foreground: "hsl(260, 30%, 15%)",
    muted: "hsl(197, 50%, 95%)",
    mutedForeground: "hsl(260, 12%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(260, 20%, 35%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(260, 30%, 15%)",
    border: "hsl(197, 30%, 82%)",
    input: "hsl(197, 30%, 82%)",
    primary: "hsl(348, 70%, 65%)",
    // Pink primary
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(197, 50%, 95%)",
    // Blue secondary background
    secondaryForeground: "hsl(197, 80%, 40%)",
    // Blue text
    accent: "hsl(197, 55%, 92%)",
    // Blue accent background
    accentForeground: "hsl(197, 80%, 40%)",
    // Blue text
    destructive: "hsl(0, 70%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(197, 80%, 50%)",
    // Blue ring
    radius: "0.5rem"
  }
};

// src/design/themes/transcend-dark.ts
var transcendDark = {
  // ==========================================================================
  // BRAND COLORS - Official Trans pride flag colors
  // Pink: #F5A9B8 = hsl(348, 79%, 81%)
  // Blue: #5BCEFA = hsl(197, 94%, 67%)
  // ==========================================================================
  brand: {
    primary: "hsl(348, 79%, 81%)",
    // Trans pink #F5A9B8
    primaryHover: "hsl(348, 79%, 88%)",
    primaryActive: "hsl(348, 79%, 75%)",
    primarySubtle: "hsl(348, 50%, 20%)",
    secondary: "hsl(197, 94%, 67%)",
    // Trans blue #5BCEFA
    secondaryHover: "hsl(197, 94%, 75%)",
    accent: "hsl(197, 94%, 67%)",
    // Trans blue as accent
    accentHover: "hsl(197, 94%, 75%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purple with blue/pink tints)
  // ==========================================================================
  background: {
    page: "hsl(260, 25%, 10%)",
    // Deep purple-black
    surface: "hsl(260, 22%, 14%)",
    // Slightly lifted
    elevated: "hsl(260, 20%, 18%)",
    // Popovers, dropdowns
    sunken: "hsl(260, 30%, 7%)",
    overlay: "hsl(260, 25%, 6%, 0.9)",
    interactive: "hsl(197, 40%, 15%)",
    // Blue-tinted interactive
    interactiveHover: "hsl(197, 45%, 20%)",
    interactiveActive: "hsl(197, 50%, 25%)",
    success: "hsl(160, 70%, 38%)",
    successSubtle: "hsl(160, 40%, 14%)",
    warning: "hsl(38, 90%, 48%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 70%, 50%)",
    errorSubtle: "hsl(0, 45%, 14%)",
    info: "hsl(197, 94%, 50%)",
    // Trans blue
    infoSubtle: "hsl(197, 60%, 16%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - with blue accents)
  // ==========================================================================
  text: {
    primary: "hsl(197, 30%, 95%)",
    // Slight blue tint
    secondary: "hsl(197, 25%, 75%)",
    // Blue-tinted secondary
    tertiary: "hsl(260, 15%, 62%)",
    muted: "hsl(260, 15%, 55%)",
    disabled: "hsl(260, 10%, 40%)",
    heading: "hsl(197, 40%, 97%)",
    // Blue-tinted headings
    body: "hsl(197, 30%, 93%)",
    caption: "hsl(197, 25%, 70%)",
    onPrimary: "hsl(260, 30%, 15%)",
    // Dark text on pink
    onSurface: "hsl(197, 30%, 95%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(197, 94%, 72%)",
    // Bright blue links
    linkHover: "hsl(197, 94%, 80%)",
    success: "hsl(160, 70%, 55%)",
    warning: "hsl(38, 90%, 62%)",
    error: "hsl(0, 70%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode - blue accented)
  // ==========================================================================
  border: {
    default: "hsl(197, 30%, 25%)",
    // Blue-tinted borders
    strong: "hsl(197, 35%, 35%)",
    subtle: "hsl(260, 20%, 18%)",
    focus: "hsl(197, 94%, 67%)",
    // Trans blue focus
    error: "hsl(0, 70%, 50%)",
    success: "hsl(160, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode - blue & pink)
  // ==========================================================================
  state: {
    focusRing: "hsl(197, 94%, 67%, 0.6)",
    // Blue focus ring
    selection: "hsl(197, 94%, 67%, 0.3)",
    // Blue selection
    highlight: "hsl(348, 79%, 81%, 0.2)"
    // Pink highlight
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - trans pride)
  // ==========================================================================
  fun: {
    celebration: "hsl(197, 94%, 67%)",
    // Trans Blue
    achievement: "hsl(160, 80%, 52%)",
    streak: "hsl(348, 79%, 81%)",
    // Trans Pink
    party: "hsl(348, 79%, 81%)"
    // Trans Pink
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - blue glow)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    pop: "0 4px 0 0 hsl(197 80% 40% / 0.5)",
    // Blue pop shadow
    glow: "0 0 30px 5px hsl(197 94% 67% / 0.4)",
    // Trans blue glow
    bounce: "0 2px 0 0 hsl(197 80% 40% / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(260, 25%, 10%)",
    foreground: "hsl(197, 30%, 95%)",
    muted: "hsl(197, 40%, 15%)",
    mutedForeground: "hsl(260, 15%, 55%)",
    popover: "hsl(260, 20%, 18%)",
    popoverForeground: "hsl(197, 25%, 75%)",
    card: "hsl(260, 22%, 14%)",
    cardForeground: "hsl(197, 30%, 95%)",
    border: "hsl(197, 30%, 25%)",
    input: "hsl(197, 30%, 25%)",
    primary: "hsl(348, 79%, 81%)",
    // Trans pink #F5A9B8
    primaryForeground: "hsl(260, 30%, 15%)",
    secondary: "hsl(197, 40%, 15%)",
    // Blue secondary background
    secondaryForeground: "hsl(197, 94%, 75%)",
    // Bright blue text
    accent: "hsl(197, 50%, 18%)",
    // Blue accent background
    accentForeground: "hsl(197, 94%, 75%)",
    // Bright blue text
    destructive: "hsl(0, 70%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(197, 94%, 67%)",
    // Trans blue ring
    radius: "0.5rem"
  }
};

// src/design/themes/sunset-light.ts
var sunsetLight = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: "hsl(15, 85%, 55%)",
    // Warm coral-orange
    primaryHover: "hsl(15, 85%, 48%)",
    primaryActive: "hsl(15, 85%, 42%)",
    primarySubtle: "hsl(15, 70%, 94%)",
    secondary: "hsl(340, 75%, 55%)",
    // Rose pink
    secondaryHover: "hsl(340, 75%, 48%)",
    accent: "hsl(45, 95%, 50%)",
    // Golden yellow
    accentHover: "hsl(45, 95%, 42%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - warm creams)
  // ==========================================================================
  background: {
    page: "hsl(30, 40%, 98%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(30, 35%, 94%)",
    overlay: "hsl(30, 30%, 20%, 0.5)",
    interactive: "hsl(30, 30%, 96%)",
    interactiveHover: "hsl(30, 30%, 92%)",
    interactiveActive: "hsl(30, 30%, 88%)",
    success: "hsl(145, 65%, 42%)",
    successSubtle: "hsl(145, 60%, 92%)",
    warning: "hsl(38, 95%, 50%)",
    warningSubtle: "hsl(38, 80%, 92%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 70%, 94%)",
    info: "hsl(200, 80%, 50%)",
    infoSubtle: "hsl(200, 70%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(20, 25%, 15%)",
    secondary: "hsl(20, 15%, 40%)",
    tertiary: "hsl(20, 12%, 50%)",
    muted: "hsl(20, 10%, 55%)",
    disabled: "hsl(20, 8%, 65%)",
    heading: "hsl(20, 30%, 12%)",
    body: "hsl(20, 25%, 18%)",
    caption: "hsl(20, 15%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(20, 25%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(15, 85%, 45%)",
    linkHover: "hsl(15, 85%, 35%)",
    success: "hsl(145, 70%, 32%)",
    warning: "hsl(30, 90%, 38%)",
    error: "hsl(0, 75%, 42%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: "hsl(30, 20%, 85%)",
    strong: "hsl(30, 20%, 75%)",
    subtle: "hsl(30, 25%, 92%)",
    focus: "hsl(15, 85%, 55%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 65%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(15, 85%, 55%, 0.4)",
    selection: "hsl(15, 85%, 55%, 0.15)",
    highlight: "hsl(45, 95%, 50%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 95%, 50%)",
    achievement: "hsl(145, 65%, 45%)",
    streak: "hsl(25, 100%, 55%)",
    party: "hsl(340, 75%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(20 30% 15% / 0.08), 0 1px 2px -1px hsl(20 30% 15% / 0.08)",
    floating: "0 4px 6px -1px hsl(20 30% 15% / 0.1), 0 2px 4px -2px hsl(20 30% 15% / 0.08)",
    overlay: "0 20px 25px -5px hsl(20 30% 15% / 0.12), 0 8px 10px -6px hsl(20 30% 15% / 0.08)",
    popup: "0 10px 15px -3px hsl(20 30% 15% / 0.1), 0 4px 6px -4px hsl(20 30% 15% / 0.08)",
    pop: "0 4px 0 0 hsl(20 30% 15% / 0.1)",
    glow: "0 0 15px 0 hsl(15 85% 55% / 0.25)",
    bounce: "0 2px 0 0 hsl(20 30% 15% / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(30, 40%, 98%)",
    foreground: "hsl(20, 25%, 15%)",
    muted: "hsl(30, 30%, 94%)",
    mutedForeground: "hsl(20, 10%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(20, 15%, 40%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(20, 25%, 15%)",
    border: "hsl(30, 20%, 85%)",
    input: "hsl(30, 20%, 85%)",
    primary: "hsl(15, 85%, 55%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(30, 30%, 94%)",
    secondaryForeground: "hsl(20, 25%, 15%)",
    accent: "hsl(15, 50%, 94%)",
    accentForeground: "hsl(15, 60%, 30%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(15, 85%, 55%)",
    radius: "0.5rem"
  }
};

// src/design/themes/sunset-dark.ts
var sunsetDark = {
  // ==========================================================================
  // BRAND COLORS - Warm sunset oranges and corals
  // ==========================================================================
  brand: {
    primary: "hsl(15, 85%, 58%)",
    // Warm coral-orange
    primaryHover: "hsl(15, 85%, 65%)",
    primaryActive: "hsl(15, 85%, 50%)",
    primarySubtle: "hsl(15, 45%, 16%)",
    secondary: "hsl(340, 75%, 62%)",
    // Rose pink
    secondaryHover: "hsl(340, 75%, 70%)",
    accent: "hsl(45, 95%, 55%)",
    // Golden yellow
    accentHover: "hsl(45, 95%, 62%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - warm browns/mahogany)
  // ==========================================================================
  background: {
    page: "hsl(15, 40%, 7%)",
    // Deep warm brown
    surface: "hsl(15, 35%, 11%)",
    elevated: "hsl(15, 30%, 15%)",
    sunken: "hsl(15, 45%, 5%)",
    overlay: "hsl(15, 40%, 4%, 0.85)",
    interactive: "hsl(15, 32%, 13%)",
    interactiveHover: "hsl(15, 28%, 19%)",
    interactiveActive: "hsl(15, 25%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(200, 85%, 52%)",
    infoSubtle: "hsl(200, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - warm whites)
  // ==========================================================================
  text: {
    primary: "hsl(30, 30%, 94%)",
    secondary: "hsl(30, 20%, 72%)",
    tertiary: "hsl(30, 15%, 60%)",
    muted: "hsl(30, 12%, 55%)",
    disabled: "hsl(30, 10%, 40%)",
    heading: "hsl(30, 35%, 97%)",
    body: "hsl(30, 30%, 92%)",
    caption: "hsl(30, 20%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(30, 30%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(15, 85%, 68%)",
    linkHover: "hsl(15, 85%, 76%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(15, 28%, 20%)",
    strong: "hsl(15, 25%, 28%)",
    subtle: "hsl(15, 32%, 14%)",
    focus: "hsl(15, 85%, 58%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(15, 85%, 58%, 0.5)",
    selection: "hsl(15, 85%, 58%, 0.25)",
    highlight: "hsl(45, 95%, 55%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 95%, 58%)",
    achievement: "hsl(145, 70%, 52%)",
    streak: "hsl(25, 100%, 58%)",
    party: "hsl(340, 75%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(15 85% 58% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(15, 40%, 7%)",
    foreground: "hsl(30, 30%, 94%)",
    muted: "hsl(15, 32%, 13%)",
    mutedForeground: "hsl(30, 12%, 55%)",
    popover: "hsl(15, 30%, 15%)",
    popoverForeground: "hsl(30, 20%, 72%)",
    card: "hsl(15, 35%, 11%)",
    cardForeground: "hsl(30, 30%, 94%)",
    border: "hsl(15, 28%, 20%)",
    input: "hsl(15, 28%, 20%)",
    primary: "hsl(15, 85%, 58%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(15, 32%, 13%)",
    secondaryForeground: "hsl(30, 30%, 94%)",
    accent: "hsl(15, 35%, 18%)",
    accentForeground: "hsl(15, 30%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(15, 85%, 58%)",
    radius: "0.5rem"
  }
};

// src/design/themes/forest-light.ts
var forestLight = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: "hsl(150, 55%, 38%)",
    // Forest green
    primaryHover: "hsl(150, 55%, 32%)",
    primaryActive: "hsl(150, 55%, 28%)",
    primarySubtle: "hsl(150, 45%, 92%)",
    secondary: "hsl(35, 80%, 45%)",
    // Warm amber
    secondaryHover: "hsl(35, 80%, 38%)",
    accent: "hsl(85, 50%, 45%)",
    // Lime green
    accentHover: "hsl(85, 50%, 38%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Light Mode - soft creams with green tint)
  // ==========================================================================
  background: {
    page: "hsl(90, 20%, 97%)",
    surface: "hsl(0, 0%, 100%)",
    elevated: "hsl(0, 0%, 100%)",
    sunken: "hsl(90, 18%, 93%)",
    overlay: "hsl(150, 30%, 15%, 0.5)",
    interactive: "hsl(90, 15%, 95%)",
    interactiveHover: "hsl(90, 15%, 91%)",
    interactiveActive: "hsl(90, 15%, 87%)",
    success: "hsl(145, 65%, 42%)",
    successSubtle: "hsl(145, 55%, 92%)",
    warning: "hsl(38, 95%, 50%)",
    warningSubtle: "hsl(38, 80%, 92%)",
    error: "hsl(0, 70%, 52%)",
    errorSubtle: "hsl(0, 65%, 94%)",
    info: "hsl(200, 80%, 50%)",
    infoSubtle: "hsl(200, 65%, 94%)"
  },
  // ==========================================================================
  // TEXT COLORS (Light Mode)
  // ==========================================================================
  text: {
    primary: "hsl(150, 25%, 15%)",
    secondary: "hsl(150, 12%, 40%)",
    tertiary: "hsl(150, 8%, 50%)",
    muted: "hsl(150, 6%, 55%)",
    disabled: "hsl(150, 5%, 65%)",
    heading: "hsl(150, 30%, 12%)",
    body: "hsl(150, 25%, 18%)",
    caption: "hsl(150, 12%, 45%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(150, 25%, 15%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(150, 55%, 32%)",
    linkHover: "hsl(150, 55%, 25%)",
    success: "hsl(145, 70%, 32%)",
    warning: "hsl(30, 90%, 38%)",
    error: "hsl(0, 75%, 42%)"
  },
  // ==========================================================================
  // BORDER COLORS (Light Mode)
  // ==========================================================================
  border: {
    default: "hsl(90, 12%, 82%)",
    strong: "hsl(90, 12%, 72%)",
    subtle: "hsl(90, 15%, 90%)",
    focus: "hsl(150, 55%, 38%)",
    error: "hsl(0, 70%, 52%)",
    success: "hsl(145, 65%, 42%)"
  },
  // ==========================================================================
  // STATE COLORS (Light Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(150, 55%, 38%, 0.4)",
    selection: "hsl(150, 55%, 38%, 0.15)",
    highlight: "hsl(35, 80%, 45%, 0.2)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Light Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(35, 85%, 50%)",
    achievement: "hsl(150, 55%, 40%)",
    streak: "hsl(25, 95%, 55%)",
    party: "hsl(85, 50%, 48%)"
  },
  // ==========================================================================
  // SHADOWS (Light Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 hsl(150 30% 15% / 0.08), 0 1px 2px -1px hsl(150 30% 15% / 0.08)",
    floating: "0 4px 6px -1px hsl(150 30% 15% / 0.1), 0 2px 4px -2px hsl(150 30% 15% / 0.08)",
    overlay: "0 20px 25px -5px hsl(150 30% 15% / 0.12), 0 8px 10px -6px hsl(150 30% 15% / 0.08)",
    popup: "0 10px 15px -3px hsl(150 30% 15% / 0.1), 0 4px 6px -4px hsl(150 30% 15% / 0.08)",
    pop: "0 4px 0 0 hsl(150 30% 15% / 0.1)",
    glow: "0 0 15px 0 hsl(150 55% 38% / 0.25)",
    bounce: "0 2px 0 0 hsl(150 30% 15% / 0.1)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(90, 20%, 97%)",
    foreground: "hsl(150, 25%, 15%)",
    muted: "hsl(90, 15%, 93%)",
    mutedForeground: "hsl(150, 6%, 55%)",
    popover: "hsl(0, 0%, 100%)",
    popoverForeground: "hsl(150, 12%, 40%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(150, 25%, 15%)",
    border: "hsl(90, 12%, 82%)",
    input: "hsl(90, 12%, 82%)",
    primary: "hsl(150, 55%, 38%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(90, 15%, 93%)",
    secondaryForeground: "hsl(150, 25%, 15%)",
    accent: "hsl(150, 40%, 92%)",
    accentForeground: "hsl(150, 50%, 25%)",
    destructive: "hsl(0, 70%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(150, 55%, 38%)",
    radius: "0.5rem"
  }
};

// src/design/themes/forest-dark.ts
var forestDark = {
  // ==========================================================================
  // BRAND COLORS - Natural forest greens
  // ==========================================================================
  brand: {
    primary: "hsl(150, 55%, 45%)",
    // Forest green
    primaryHover: "hsl(150, 55%, 52%)",
    primaryActive: "hsl(150, 55%, 38%)",
    primarySubtle: "hsl(150, 35%, 15%)",
    secondary: "hsl(35, 80%, 52%)",
    // Warm amber
    secondaryHover: "hsl(35, 80%, 60%)",
    accent: "hsl(85, 55%, 52%)",
    // Lime green
    accentHover: "hsl(85, 55%, 60%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep forest greens)
  // ==========================================================================
  background: {
    page: "hsl(150, 35%, 7%)",
    // Deep forest green
    surface: "hsl(150, 30%, 11%)",
    elevated: "hsl(150, 25%, 15%)",
    sunken: "hsl(150, 40%, 5%)",
    overlay: "hsl(150, 35%, 4%, 0.85)",
    interactive: "hsl(150, 28%, 13%)",
    interactiveHover: "hsl(150, 24%, 19%)",
    interactiveActive: "hsl(150, 20%, 23%)",
    success: "hsl(145, 70%, 38%)",
    successSubtle: "hsl(145, 40%, 14%)",
    warning: "hsl(38, 92%, 50%)",
    warningSubtle: "hsl(38, 40%, 14%)",
    error: "hsl(0, 65%, 50%)",
    errorSubtle: "hsl(0, 40%, 14%)",
    info: "hsl(200, 85%, 52%)",
    infoSubtle: "hsl(200, 40%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - warm whites with green tint)
  // ==========================================================================
  text: {
    primary: "hsl(90, 20%, 94%)",
    secondary: "hsl(90, 15%, 72%)",
    tertiary: "hsl(90, 10%, 60%)",
    muted: "hsl(90, 8%, 55%)",
    disabled: "hsl(90, 6%, 40%)",
    heading: "hsl(90, 25%, 97%)",
    body: "hsl(90, 20%, 92%)",
    caption: "hsl(90, 15%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(90, 20%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(150, 55%, 55%)",
    linkHover: "hsl(150, 55%, 65%)",
    success: "hsl(145, 70%, 58%)",
    warning: "hsl(38, 92%, 62%)",
    error: "hsl(0, 65%, 62%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(150, 25%, 20%)",
    strong: "hsl(150, 22%, 28%)",
    subtle: "hsl(150, 28%, 14%)",
    focus: "hsl(150, 55%, 45%)",
    error: "hsl(0, 65%, 50%)",
    success: "hsl(145, 70%, 38%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(150, 55%, 45%, 0.5)",
    selection: "hsl(150, 55%, 45%, 0.25)",
    highlight: "hsl(35, 80%, 52%, 0.12)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode)
  // ==========================================================================
  fun: {
    celebration: "hsl(35, 85%, 55%)",
    achievement: "hsl(150, 55%, 48%)",
    streak: "hsl(25, 95%, 58%)",
    party: "hsl(85, 55%, 55%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.4)",
    glow: "0 0 20px 0 hsl(150 55% 45% / 0.35)",
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(150, 35%, 7%)",
    foreground: "hsl(90, 20%, 94%)",
    muted: "hsl(150, 28%, 13%)",
    mutedForeground: "hsl(90, 8%, 55%)",
    popover: "hsl(150, 25%, 15%)",
    popoverForeground: "hsl(90, 15%, 72%)",
    card: "hsl(150, 30%, 11%)",
    cardForeground: "hsl(90, 20%, 94%)",
    border: "hsl(150, 25%, 20%)",
    input: "hsl(150, 25%, 20%)",
    primary: "hsl(150, 55%, 45%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(150, 28%, 13%)",
    secondaryForeground: "hsl(90, 20%, 94%)",
    accent: "hsl(150, 30%, 18%)",
    accentForeground: "hsl(150, 30%, 95%)",
    destructive: "hsl(0, 65%, 50%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(150, 55%, 45%)",
    radius: "0.5rem"
  }
};

// src/design/themes/synthwave-dark.ts
var synthwaveDark = {
  // ==========================================================================
  // BRAND COLORS - Neon retro colors
  // ==========================================================================
  brand: {
    primary: "hsl(320, 95%, 60%)",
    // Hot pink
    primaryHover: "hsl(320, 95%, 68%)",
    primaryActive: "hsl(320, 95%, 52%)",
    primarySubtle: "hsl(320, 50%, 18%)",
    secondary: "hsl(180, 100%, 50%)",
    // Electric cyan
    secondaryHover: "hsl(180, 100%, 58%)",
    accent: "hsl(270, 90%, 65%)",
    // Neon purple
    accentHover: "hsl(270, 90%, 72%)"
  },
  // ==========================================================================
  // BACKGROUND COLORS (Dark Mode - deep purples)
  // ==========================================================================
  background: {
    page: "hsl(260, 50%, 6%)",
    // Deep purple-black
    surface: "hsl(260, 45%, 10%)",
    elevated: "hsl(260, 40%, 14%)",
    sunken: "hsl(260, 55%, 4%)",
    overlay: "hsl(260, 50%, 3%, 0.9)",
    interactive: "hsl(260, 42%, 12%)",
    interactiveHover: "hsl(260, 38%, 18%)",
    interactiveActive: "hsl(260, 35%, 22%)",
    success: "hsl(160, 80%, 40%)",
    successSubtle: "hsl(160, 45%, 14%)",
    warning: "hsl(45, 100%, 50%)",
    warningSubtle: "hsl(45, 50%, 14%)",
    error: "hsl(0, 75%, 52%)",
    errorSubtle: "hsl(0, 45%, 14%)",
    info: "hsl(180, 100%, 45%)",
    infoSubtle: "hsl(180, 50%, 14%)"
  },
  // ==========================================================================
  // TEXT COLORS (Dark Mode - bright whites with cyan tint)
  // ==========================================================================
  text: {
    primary: "hsl(180, 20%, 94%)",
    secondary: "hsl(180, 15%, 72%)",
    tertiary: "hsl(180, 10%, 60%)",
    muted: "hsl(260, 12%, 55%)",
    disabled: "hsl(260, 10%, 40%)",
    heading: "hsl(180, 25%, 98%)",
    body: "hsl(180, 20%, 92%)",
    caption: "hsl(180, 15%, 68%)",
    onPrimary: "hsl(0, 0%, 100%)",
    onSurface: "hsl(180, 20%, 94%)",
    onError: "hsl(0, 0%, 100%)",
    link: "hsl(320, 95%, 70%)",
    linkHover: "hsl(320, 95%, 80%)",
    success: "hsl(160, 80%, 55%)",
    warning: "hsl(45, 100%, 60%)",
    error: "hsl(0, 75%, 65%)"
  },
  // ==========================================================================
  // BORDER COLORS (Dark Mode)
  // ==========================================================================
  border: {
    default: "hsl(260, 35%, 22%)",
    strong: "hsl(260, 32%, 30%)",
    subtle: "hsl(260, 40%, 14%)",
    focus: "hsl(320, 95%, 60%)",
    error: "hsl(0, 75%, 52%)",
    success: "hsl(160, 80%, 40%)"
  },
  // ==========================================================================
  // STATE COLORS (Dark Mode)
  // ==========================================================================
  state: {
    focusRing: "hsl(320, 95%, 60%, 0.5)",
    selection: "hsl(270, 90%, 65%, 0.25)",
    highlight: "hsl(180, 100%, 50%, 0.15)"
  },
  // ==========================================================================
  // FUN/CELEBRATION COLORS (Dark Mode - extra vibrant)
  // ==========================================================================
  fun: {
    celebration: "hsl(45, 100%, 55%)",
    achievement: "hsl(160, 80%, 50%)",
    streak: "hsl(25, 100%, 58%)",
    party: "hsl(320, 95%, 62%)"
  },
  // ==========================================================================
  // SHADOWS (Dark Mode - with glow effects)
  // ==========================================================================
  shadow: {
    raised: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
    floating: "0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -2px rgb(0 0 0 / 0.5)",
    overlay: "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)",
    popup: "0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    pop: "0 4px 0 0 rgb(0 0 0 / 0.5)",
    glow: "0 0 30px 5px hsl(320 95% 60% / 0.4)",
    // Extra glowy
    bounce: "0 2px 0 0 rgb(0 0 0 / 0.5)"
  },
  // ==========================================================================
  // LEGACY COLORS (for backwards compatibility with shadcn/ui)
  // ==========================================================================
  legacy: {
    background: "hsl(260, 50%, 6%)",
    foreground: "hsl(180, 20%, 94%)",
    muted: "hsl(260, 42%, 12%)",
    mutedForeground: "hsl(260, 12%, 55%)",
    popover: "hsl(260, 40%, 14%)",
    popoverForeground: "hsl(180, 15%, 72%)",
    card: "hsl(260, 45%, 10%)",
    cardForeground: "hsl(180, 20%, 94%)",
    border: "hsl(260, 35%, 22%)",
    input: "hsl(260, 35%, 22%)",
    primary: "hsl(320, 95%, 60%)",
    primaryForeground: "hsl(0, 0%, 100%)",
    secondary: "hsl(260, 42%, 12%)",
    secondaryForeground: "hsl(180, 20%, 94%)",
    accent: "hsl(270, 45%, 20%)",
    accentForeground: "hsl(270, 50%, 92%)",
    destructive: "hsl(0, 75%, 52%)",
    destructiveForeground: "hsl(0, 0%, 98%)",
    ring: "hsl(320, 95%, 60%)",
    radius: "0.5rem"
  }
};

// src/design/themes/index.ts
var groupiLightTheme = {
  id: "groupi-light",
  name: "Groupi Light",
  description: "The default purple-focused light theme",
  mode: "light",
  preview: {
    primary: groupiLight.brand.primary,
    background: groupiLight.background.page,
    accent: groupiLight.brand.accent
  },
  tokens: groupiLight
};
var groupiDarkTheme = {
  id: "groupi-dark",
  name: "Groupi Dark",
  description: "The default purple-focused dark theme",
  mode: "dark",
  preview: {
    primary: groupiDark.brand.primary,
    background: groupiDark.background.page,
    accent: groupiDark.brand.accent
  },
  tokens: groupiDark
};
var oledDarkTheme = {
  id: "oled-dark",
  name: "OLED Dark",
  description: "True black theme optimized for OLED screens",
  mode: "dark",
  preview: {
    primary: oledDark.brand.primary,
    background: oledDark.background.page,
    accent: oledDark.brand.accent
  },
  tokens: oledDark
};
var oceanLightTheme = {
  id: "ocean-light",
  name: "Ocean Light",
  description: "A calm, blue-focused light theme",
  mode: "light",
  preview: {
    primary: oceanLight.brand.primary,
    background: oceanLight.background.page,
    accent: oceanLight.brand.accent
  },
  tokens: oceanLight
};
var oceanDarkTheme = {
  id: "ocean-dark",
  name: "Ocean Dark",
  description: "A calm, blue-focused dark theme",
  mode: "dark",
  preview: {
    primary: oceanDark.brand.primary,
    background: oceanDark.background.page,
    accent: oceanDark.brand.accent
  },
  tokens: oceanDark
};
var transcendLightTheme = {
  id: "transcend-light",
  name: "Transcend Light",
  description: "Trans pride inspired with vibrant pinks and blues",
  mode: "light",
  preview: {
    primary: transcendLight.brand.primary,
    background: transcendLight.background.page,
    accent: transcendLight.brand.accent
  },
  tokens: transcendLight
};
var transcendDarkTheme = {
  id: "transcend-dark",
  name: "Transcend Dark",
  description: "Trans pride inspired with vibrant pinks and blues",
  mode: "dark",
  preview: {
    primary: transcendDark.brand.primary,
    background: transcendDark.background.page,
    accent: transcendDark.brand.accent
  },
  tokens: transcendDark
};
var sunsetLightTheme = {
  id: "sunset-light",
  name: "Sunset Light",
  description: "Warm coral and orange inspired by golden hour",
  mode: "light",
  preview: {
    primary: sunsetLight.brand.primary,
    background: sunsetLight.background.page,
    accent: sunsetLight.brand.accent
  },
  tokens: sunsetLight
};
var sunsetDarkTheme = {
  id: "sunset-dark",
  name: "Sunset Dark",
  description: "Warm coral and orange on deep mahogany",
  mode: "dark",
  preview: {
    primary: sunsetDark.brand.primary,
    background: sunsetDark.background.page,
    accent: sunsetDark.brand.accent
  },
  tokens: sunsetDark
};
var forestLightTheme = {
  id: "forest-light",
  name: "Forest Light",
  description: "Earthy greens and warm ambers",
  mode: "light",
  preview: {
    primary: forestLight.brand.primary,
    background: forestLight.background.page,
    accent: forestLight.brand.accent
  },
  tokens: forestLight
};
var forestDarkTheme = {
  id: "forest-dark",
  name: "Forest Dark",
  description: "Deep forest greens with amber glow",
  mode: "dark",
  preview: {
    primary: forestDark.brand.primary,
    background: forestDark.background.page,
    accent: forestDark.brand.accent
  },
  tokens: forestDark
};
var synthwaveDarkTheme = {
  id: "synthwave-dark",
  name: "Synthwave",
  description: "80s retro with hot pink and electric cyan",
  mode: "dark",
  preview: {
    primary: synthwaveDark.brand.primary,
    background: synthwaveDark.background.page,
    accent: synthwaveDark.brand.accent
  },
  tokens: synthwaveDark
};
var baseThemeRegistry = {
  "groupi-light": groupiLightTheme,
  "groupi-dark": groupiDarkTheme,
  "oled-dark": oledDarkTheme,
  "ocean-light": oceanLightTheme,
  "ocean-dark": oceanDarkTheme,
  "transcend-light": transcendLightTheme,
  "transcend-dark": transcendDarkTheme,
  "sunset-light": sunsetLightTheme,
  "sunset-dark": sunsetDarkTheme,
  "forest-light": forestLightTheme,
  "forest-dark": forestDarkTheme,
  "synthwave-dark": synthwaveDarkTheme
};
var baseThemes = Object.values(baseThemeRegistry);
var lightThemes = baseThemes.filter(
  (theme) => theme.mode === "light"
);
var darkThemes = baseThemes.filter(
  (theme) => theme.mode === "dark"
);
var DEFAULT_LIGHT_THEME_ID = "groupi-light";
var DEFAULT_DARK_THEME_ID = "groupi-dark";
function getBaseTheme(id) {
  return baseThemeRegistry[id];
}
function getPairedTheme(id) {
  const theme = baseThemeRegistry[id];
  if (!theme) return void 0;
  const family = id.replace(/-light$|-dark$/, "");
  const pairedMode = theme.mode === "light" ? "dark" : "light";
  const pairedId = `${family}-${pairedMode}`;
  return baseThemeRegistry[pairedId];
}
var themes = {
  light: groupiLight,
  dark: groupiDark
};
var tokens = sharedTokens;

export { DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, baseThemeRegistry, baseThemes, darkThemes, forestDark, forestDarkTheme, forestLight, forestLightTheme, getBaseTheme, getPairedTheme, groupiDark, groupiDarkTheme, groupiLight, groupiLightTheme, lightThemes, oceanDark, oceanDarkTheme, oceanLight, oceanLightTheme, oledDark, oledDarkTheme, sharedTokens, sunsetDark, sunsetDarkTheme, sunsetLight, sunsetLightTheme, synthwaveDark, synthwaveDarkTheme, themes, tokens, transcendDark, transcendDarkTheme, transcendLight, transcendLightTheme };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map