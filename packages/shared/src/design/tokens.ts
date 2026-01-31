/**
 * Groupi Design Tokens
 * A three-layer token system: Primitives → Semantic → Component
 *
 * Inspired by Duolingo's fun-first, dramatically rounded aesthetic
 */

// =============================================================================
// LAYER 1: PRIMITIVES
// Raw values - the foundation. Never use directly in components.
// =============================================================================

export const primitives = {
  colors: {
    // Brand colors (HSL values)
    purple: {
      50: 'hsl(285, 100%, 97%)',
      100: 'hsl(285, 100%, 94%)',
      200: 'hsl(285, 100%, 88%)',
      300: 'hsl(285, 100%, 76%)',
      400: 'hsl(285, 100%, 60%)',
      500: 'hsl(285, 100%, 50%)',
      600: 'hsl(285, 100%, 40%)',
      700: 'hsl(285, 100%, 34%)', // Primary brand color
      800: 'hsl(285, 100%, 28%)',
      900: 'hsl(285, 100%, 22%)',
      950: 'hsl(285, 100%, 12%)',
    },
    blue: {
      50: 'hsl(210, 100%, 97%)',
      100: 'hsl(210, 100%, 94%)',
      200: 'hsl(210, 100%, 86%)',
      300: 'hsl(210, 100%, 74%)',
      400: 'hsl(210, 100%, 62%)',
      500: 'hsl(210, 100%, 50%)', // Secondary
      600: 'hsl(210, 100%, 42%)',
      700: 'hsl(210, 100%, 34%)',
      800: 'hsl(210, 100%, 26%)',
      900: 'hsl(210, 100%, 18%)',
    },
    pink: {
      50: 'hsl(330, 100%, 97%)',
      100: 'hsl(330, 100%, 94%)',
      200: 'hsl(330, 100%, 88%)',
      300: 'hsl(330, 100%, 76%)',
      400: 'hsl(330, 100%, 68%)',
      500: 'hsl(330, 100%, 60%)', // Accent
      600: 'hsl(330, 100%, 50%)',
      700: 'hsl(330, 100%, 42%)',
      800: 'hsl(330, 100%, 34%)',
      900: 'hsl(330, 100%, 26%)',
    },
    green: {
      50: 'hsl(145, 80%, 96%)',
      100: 'hsl(145, 80%, 90%)',
      200: 'hsl(145, 80%, 80%)',
      300: 'hsl(145, 80%, 65%)',
      400: 'hsl(145, 80%, 52%)',
      500: 'hsl(145, 80%, 45%)', // Success
      600: 'hsl(145, 80%, 36%)',
      700: 'hsl(145, 80%, 28%)',
      800: 'hsl(145, 80%, 20%)',
      900: 'hsl(145, 80%, 12%)',
    },
    orange: {
      50: 'hsl(35, 100%, 96%)',
      100: 'hsl(35, 100%, 90%)',
      200: 'hsl(35, 100%, 82%)',
      300: 'hsl(35, 100%, 70%)',
      400: 'hsl(35, 100%, 60%)',
      500: 'hsl(35, 100%, 55%)', // Warning
      600: 'hsl(35, 100%, 45%)',
      700: 'hsl(35, 100%, 36%)',
      800: 'hsl(35, 100%, 28%)',
      900: 'hsl(35, 100%, 20%)',
    },
    red: {
      50: 'hsl(0, 85%, 97%)',
      100: 'hsl(0, 85%, 93%)',
      200: 'hsl(0, 85%, 86%)',
      300: 'hsl(0, 85%, 75%)',
      400: 'hsl(0, 85%, 65%)',
      500: 'hsl(0, 85%, 55%)', // Error
      600: 'hsl(0, 85%, 46%)',
      700: 'hsl(0, 85%, 38%)',
      800: 'hsl(0, 85%, 30%)',
      900: 'hsl(0, 85%, 22%)',
    },
    yellow: {
      50: 'hsl(45, 100%, 96%)',
      100: 'hsl(45, 100%, 90%)',
      200: 'hsl(45, 100%, 80%)',
      300: 'hsl(45, 100%, 68%)',
      400: 'hsl(45, 100%, 56%)',
      500: 'hsl(45, 100%, 50%)', // Celebration
      600: 'hsl(45, 100%, 42%)',
      700: 'hsl(45, 100%, 34%)',
      800: 'hsl(45, 100%, 26%)',
      900: 'hsl(45, 100%, 18%)',
    },
    gray: {
      50: 'hsl(220, 14%, 98%)',
      100: 'hsl(220, 14%, 96%)',
      200: 'hsl(220, 13%, 91%)',
      300: 'hsl(218, 12%, 83%)',
      400: 'hsl(217, 10%, 65%)',
      500: 'hsl(217, 9%, 50%)',
      600: 'hsl(217, 9%, 40%)',
      700: 'hsl(215, 11%, 30%)',
      800: 'hsl(217, 14%, 18%)',
      900: 'hsl(222, 47%, 11%)',
      950: 'hsl(229, 84%, 5%)',
    },
    white: 'hsl(0, 0%, 100%)',
    black: 'hsl(0, 0%, 0%)',
  },

  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px
    12: '3rem', // 48px
    14: '3.5rem', // 56px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem', // 128px
  },

  radius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  duration: {
    0: '0ms',
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Fun, bouncy easings (Duolingo-inspired)
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
  },
} as const;

// =============================================================================
// LAYER 2: SEMANTIC TOKENS
// Purpose-based tokens that reference CSS variables. Use in components.
// =============================================================================

export const semantic = {
  colors: {
    // Brand
    brand: {
      primary: 'var(--brand-primary)',
      primaryHover: 'var(--brand-primary-hover)',
      primaryActive: 'var(--brand-primary-active)',
      primarySubtle: 'var(--brand-primary-subtle)',
      secondary: 'var(--brand-secondary)',
      secondaryHover: 'var(--brand-secondary-hover)',
      accent: 'var(--brand-accent)',
      accentHover: 'var(--brand-accent-hover)',
    },

    // Backgrounds
    background: {
      page: 'var(--bg-page)',
      surface: 'var(--bg-surface)',
      elevated: 'var(--bg-elevated)',
      sunken: 'var(--bg-sunken)',
      overlay: 'var(--bg-overlay)',
      interactive: 'var(--bg-interactive)',
      interactiveHover: 'var(--bg-interactive-hover)',
      interactiveActive: 'var(--bg-interactive-active)',
      success: 'var(--bg-success)',
      successSubtle: 'var(--bg-success-subtle)',
      warning: 'var(--bg-warning)',
      warningSubtle: 'var(--bg-warning-subtle)',
      error: 'var(--bg-error)',
      errorSubtle: 'var(--bg-error-subtle)',
      info: 'var(--bg-info)',
      infoSubtle: 'var(--bg-info-subtle)',
    },

    // Text
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      tertiary: 'var(--text-tertiary)',
      muted: 'var(--text-muted)',
      disabled: 'var(--text-disabled)',
      heading: 'var(--text-heading)',
      body: 'var(--text-body)',
      caption: 'var(--text-caption)',
      onPrimary: 'var(--text-on-primary)',
      onSurface: 'var(--text-on-surface)',
      onError: 'var(--text-on-error)',
      link: 'var(--text-link)',
      linkHover: 'var(--text-link-hover)',
      success: 'var(--text-success)',
      warning: 'var(--text-warning)',
      error: 'var(--text-error)',
    },

    // Borders
    border: {
      default: 'var(--border-default)',
      strong: 'var(--border-strong)',
      subtle: 'var(--border-subtle)',
      focus: 'var(--border-focus)',
      error: 'var(--border-error)',
      success: 'var(--border-success)',
    },

    // States
    state: {
      focusRing: 'var(--state-focus-ring)',
      selection: 'var(--state-selection)',
      highlight: 'var(--state-highlight)',
    },

    // Fun/celebration colors (Duolingo/Discord inspired)
    fun: {
      celebration: 'var(--fun-celebration)',
      achievement: 'var(--fun-achievement)',
      streak: 'var(--fun-streak)',
      party: 'var(--fun-party)',
    },
  },

  // Typography
  typography: {
    heading: {
      display: {
        fontSize: 'var(--font-size-display)',
        lineHeight: 'var(--line-height-display)',
        fontWeight: 'var(--font-weight-display)',
        letterSpacing: 'var(--letter-spacing-display)',
      },
      h1: {
        fontSize: 'var(--font-size-h1)',
        lineHeight: 'var(--line-height-h1)',
        fontWeight: 'var(--font-weight-h1)',
      },
      h2: {
        fontSize: 'var(--font-size-h2)',
        lineHeight: 'var(--line-height-h2)',
        fontWeight: 'var(--font-weight-h2)',
      },
      h3: {
        fontSize: 'var(--font-size-h3)',
        lineHeight: 'var(--line-height-h3)',
        fontWeight: 'var(--font-weight-h3)',
      },
      h4: {
        fontSize: 'var(--font-size-h4)',
        lineHeight: 'var(--line-height-h4)',
        fontWeight: 'var(--font-weight-h4)',
      },
    },
    body: {
      lg: {
        fontSize: 'var(--font-size-body-lg)',
        lineHeight: 'var(--line-height-body-lg)',
      },
      md: {
        fontSize: 'var(--font-size-body-md)',
        lineHeight: 'var(--line-height-body-md)',
      },
      sm: {
        fontSize: 'var(--font-size-body-sm)',
        lineHeight: 'var(--line-height-body-sm)',
      },
      xs: {
        fontSize: 'var(--font-size-body-xs)',
        lineHeight: 'var(--line-height-body-xs)',
      },
    },
    ui: {
      label: {
        fontSize: 'var(--font-size-label)',
        lineHeight: 'var(--line-height-label)',
        fontWeight: 'var(--font-weight-label)',
      },
      button: {
        fontSize: 'var(--font-size-button)',
        lineHeight: 'var(--line-height-button)',
        fontWeight: 'var(--font-weight-button)',
      },
      caption: {
        fontSize: 'var(--font-size-caption)',
        lineHeight: 'var(--line-height-caption)',
      },
      overline: {
        fontSize: 'var(--font-size-overline)',
        lineHeight: 'var(--line-height-overline)',
        letterSpacing: 'var(--letter-spacing-overline)',
        textTransform: 'uppercase' as const,
      },
      badge: {
        fontSize: 'var(--font-size-badge)',
        lineHeight: 'var(--line-height-badge)',
        fontWeight: 'var(--font-weight-badge)',
      },
    },
    fontFamily: {
      sans: 'var(--font-sans)',
      heading: 'var(--font-heading)',
      mono: 'var(--font-mono)',
    },
  },

  // Spacing (semantic purposes)
  spacing: {
    // Inset (padding)
    inset: {
      none: '0',
      xs: 'var(--inset-xs)', // 4px
      sm: 'var(--inset-sm)', // 8px
      md: 'var(--inset-md)', // 16px
      lg: 'var(--inset-lg)', // 24px
      xl: 'var(--inset-xl)', // 32px
      '2xl': 'var(--inset-2xl)', // 48px
    },
    // Stack (vertical gaps between elements)
    stack: {
      xs: 'var(--stack-xs)', // 4px
      sm: 'var(--stack-sm)', // 8px
      md: 'var(--stack-md)', // 16px
      lg: 'var(--stack-lg)', // 24px
      xl: 'var(--stack-xl)', // 32px
      section: 'var(--stack-section)', // 48px
    },
    // Inline (horizontal gaps)
    inline: {
      xs: 'var(--inline-xs)', // 4px
      sm: 'var(--inline-sm)', // 8px
      md: 'var(--inline-md)', // 16px
      lg: 'var(--inline-lg)', // 24px
    },
    // Layout
    layout: {
      pageMargin: 'var(--layout-page-margin)',
      sectionGap: 'var(--layout-section-gap)',
      containerPadding: 'var(--layout-container-padding)',
    },
  },

  // Border Radius (dramatically rounded - Duolingo style)
  radius: {
    shape: {
      none: '0',
      subtle: 'var(--shape-subtle)', // 8px
      soft: 'var(--shape-soft)', // 16px
      rounded: 'var(--shape-rounded)', // 20px
      pill: 'var(--shape-pill)', // 9999px
      circle: '50%',
    },
    component: {
      button: 'var(--radius-button)', // 16px - very rounded like Duolingo
      card: 'var(--radius-card)', // 20px - friendly, approachable
      input: 'var(--radius-input)', // 12px
      badge: 'var(--radius-badge)', // pill
      avatar: 'var(--radius-avatar)', // circle
      modal: 'var(--radius-modal)', // 24px
      tooltip: 'var(--radius-tooltip)', // 12px
      dropdown: 'var(--radius-dropdown)', // 16px
      sheet: 'var(--radius-sheet)', // 24px (top corners)
    },
  },

  // Shadows (elevation system)
  shadow: {
    elevation: {
      none: 'none',
      raised: 'var(--shadow-raised)', // Cards, buttons
      floating: 'var(--shadow-floating)', // Dropdowns, popovers
      overlay: 'var(--shadow-overlay)', // Modals, sheets
      popup: 'var(--shadow-popup)', // Tooltips, toasts
    },
    fun: {
      pop: 'var(--shadow-pop)', // Playful depth effect
      glow: 'var(--shadow-glow)', // Colored glow around elements
      bounce: 'var(--shadow-bounce)', // Pressed/active state shadow
    },
  },

  // Animation
  animation: {
    duration: {
      instant: 'var(--duration-instant)', // 0ms
      micro: 'var(--duration-micro)', // 100ms
      fast: 'var(--duration-fast)', // 150ms
      normal: 'var(--duration-normal)', // 200ms
      slow: 'var(--duration-slow)', // 300ms
      slower: 'var(--duration-slower)', // 500ms
    },
    easing: {
      default: 'var(--easing-default)',
      enter: 'var(--easing-enter)',
      exit: 'var(--easing-exit)',
      bounce: 'var(--easing-bounce)',
      spring: 'var(--easing-spring)',
    },
  },

  // Z-Index
  zIndex: {
    // Local stacking (within components, use for relative positioning)
    lifted: 'var(--z-lifted)', // 1 - Slightly above siblings
    float: 'var(--z-float)', // 2 - Floating above local content
    top: 'var(--z-top)', // 3 - Topmost in local context

    // Global stacking (for overlays, modals, etc.)
    base: 'var(--z-base)', // 0
    dropdown: 'var(--z-dropdown)', // 10
    sticky: 'var(--z-sticky)', // 20
    modal: 'var(--z-modal)', // 30
    popover: 'var(--z-popover)', // 40
    toast: 'var(--z-toast)', // 50
    tooltip: 'var(--z-tooltip)', // 60
    overlay: 'var(--z-overlay)', // 70
  },
} as const;

// =============================================================================
// LAYER 3: COMPONENT TOKENS
// Component-specific tokens. Use for consistent component styling.
// =============================================================================

export const components = {
  button: {
    radius: semantic.radius.component.button,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    fontSize: semantic.typography.ui.button.fontSize,
    fontWeight: semantic.typography.ui.button.fontWeight,
    transition: `all ${primitives.duration[150]} ${primitives.easing.bounce}`,
    sizes: {
      sm: {
        height: '2rem', // 32px
        paddingX: semantic.spacing.inset.sm,
        fontSize: primitives.fontSize.sm,
      },
      md: {
        height: '2.5rem', // 40px
        paddingX: semantic.spacing.inset.md,
        fontSize: primitives.fontSize.sm,
      },
      lg: {
        height: '2.75rem', // 44px
        paddingX: semantic.spacing.inset.lg,
        fontSize: primitives.fontSize.base,
      },
      icon: {
        size: '2.5rem', // 40px
        padding: semantic.spacing.inset.sm,
      },
    },
  },

  card: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.raised,
    borderWidth: '1px',
    gap: semantic.spacing.stack.md,
  },

  input: {
    radius: semantic.radius.component.input,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    height: '2.5rem', // 40px
    fontSize: primitives.fontSize.sm,
    borderWidth: '1px',
    transition: `border-color ${primitives.duration[150]} ${primitives.easing.inOut}`,
  },

  badge: {
    radius: semantic.radius.component.badge,
    paddingX: semantic.spacing.inset.sm,
    paddingY: semantic.spacing.inset.xs,
    fontSize: semantic.typography.ui.badge.fontSize,
    fontWeight: semantic.typography.ui.badge.fontWeight,
  },

  avatar: {
    radius: semantic.radius.component.avatar,
    sizes: {
      xs: '1.5rem', // 24px
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
      xl: '4rem', // 64px
      '2xl': '5rem', // 80px
    },
  },

  modal: {
    radius: semantic.radius.component.modal,
    padding: semantic.spacing.inset.xl,
    shadow: semantic.shadow.elevation.overlay,
    maxWidth: '32rem', // 512px
    gap: semantic.spacing.stack.lg,
  },

  sheet: {
    radius: semantic.radius.component.sheet,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.overlay,
  },

  popover: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.sm,
    shadow: semantic.shadow.elevation.floating,
    minWidth: '8rem', // 128px
  },

  tooltip: {
    radius: semantic.radius.component.tooltip,
    padding: `${semantic.spacing.inset.xs} ${semantic.spacing.inset.sm}`,
    shadow: semantic.shadow.elevation.popup,
    fontSize: primitives.fontSize.sm,
  },

  dropdown: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.xs,
    shadow: semantic.shadow.elevation.floating,
    itemPaddingX: semantic.spacing.inset.sm,
    itemPaddingY: semantic.spacing.inset.xs,
    itemRadius: semantic.radius.shape.subtle,
  },

  tabs: {
    radius: semantic.radius.shape.subtle,
    padding: semantic.spacing.inset.sm,
    gap: semantic.spacing.inline.xs,
  },

  checkbox: {
    size: '1rem', // 16px
    radius: primitives.radius.sm, // 4px
    borderWidth: '2px',
  },

  switch: {
    width: '2.75rem', // 44px
    height: '1.5rem', // 24px
    thumbSize: '1.25rem', // 20px
    radius: semantic.radius.shape.pill,
  },

  progress: {
    height: '0.5rem', // 8px
    radius: semantic.radius.shape.pill,
  },

  skeleton: {
    radius: semantic.radius.shape.subtle,
  },

  alert: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    iconSize: '1.25rem', // 20px
  },

  toast: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    shadow: semantic.shadow.elevation.popup,
  },
} as const;

// =============================================================================
// BREAKPOINTS
// Responsive design breakpoints
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// TYPE EXPORTS
// TypeScript types for type-safe usage
// =============================================================================

export type Primitives = typeof primitives;
export type Semantic = typeof semantic;
export type Components = typeof components;
export type Breakpoints = typeof breakpoints;

// Color type helpers
export type PrimitiveColor = keyof typeof primitives.colors;
export type SemanticColor = keyof typeof semantic.colors;
export type BrandColor = keyof typeof semantic.colors.brand;
export type BackgroundColor = keyof typeof semantic.colors.background;
export type TextColor = keyof typeof semantic.colors.text;
export type BorderColor = keyof typeof semantic.colors.border;

// Spacing type helpers
export type InsetSpacing = keyof typeof semantic.spacing.inset;
export type StackSpacing = keyof typeof semantic.spacing.stack;
export type InlineSpacing = keyof typeof semantic.spacing.inline;

// Radius type helpers
export type ShapeRadius = keyof typeof semantic.radius.shape;
export type ComponentRadius = keyof typeof semantic.radius.component;

// Shadow type helpers
export type ElevationShadow = keyof typeof semantic.shadow.elevation;
export type FunShadow = keyof typeof semantic.shadow.fun;

// Animation type helpers
export type AnimationDuration = keyof typeof semantic.animation.duration;
export type AnimationEasing = keyof typeof semantic.animation.easing;

// =============================================================================
// LEGACY EXPORTS (for backwards compatibility during migration)
// These map to the old token structure. Remove after full migration.
// =============================================================================

/** @deprecated Use semantic.colors instead */
export const colors = {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

/** @deprecated Use primitives.spacing instead */
export const spacing = primitives.spacing;

/** @deprecated Use semantic.typography instead */
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }] as const,
    sm: ['0.875rem', { lineHeight: '1.25rem' }] as const,
    base: ['1rem', { lineHeight: '1.5rem' }] as const,
    lg: ['1.125rem', { lineHeight: '1.75rem' }] as const,
    xl: ['1.25rem', { lineHeight: '1.75rem' }] as const,
    '2xl': ['1.5rem', { lineHeight: '2rem' }] as const,
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }] as const,
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }] as const,
  },
  fontWeight: primitives.fontWeight,
} as const;

/** @deprecated Use semantic.radius instead */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

/** @deprecated Use semantic.shadow instead */
export const shadows = primitives.shadows;

/** @deprecated Use semantic.animation instead */
export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    easeInOut: primitives.easing.inOut,
    easeOut: primitives.easing.out,
    easeIn: primitives.easing.in,
  },
} as const;
