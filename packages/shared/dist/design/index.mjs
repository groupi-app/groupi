import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// src/design/tokens.ts
var primitives = {
  colors: {
    // Brand colors (HSL values)
    purple: {
      50: "hsl(285, 100%, 97%)",
      100: "hsl(285, 100%, 94%)",
      200: "hsl(285, 100%, 88%)",
      300: "hsl(285, 100%, 76%)",
      400: "hsl(285, 100%, 60%)",
      500: "hsl(285, 100%, 50%)",
      600: "hsl(285, 100%, 40%)",
      700: "hsl(285, 100%, 34%)",
      // Primary brand color
      800: "hsl(285, 100%, 28%)",
      900: "hsl(285, 100%, 22%)",
      950: "hsl(285, 100%, 12%)"
    },
    blue: {
      50: "hsl(210, 100%, 97%)",
      100: "hsl(210, 100%, 94%)",
      200: "hsl(210, 100%, 86%)",
      300: "hsl(210, 100%, 74%)",
      400: "hsl(210, 100%, 62%)",
      500: "hsl(210, 100%, 50%)",
      // Secondary
      600: "hsl(210, 100%, 42%)",
      700: "hsl(210, 100%, 34%)",
      800: "hsl(210, 100%, 26%)",
      900: "hsl(210, 100%, 18%)"
    },
    pink: {
      50: "hsl(330, 100%, 97%)",
      100: "hsl(330, 100%, 94%)",
      200: "hsl(330, 100%, 88%)",
      300: "hsl(330, 100%, 76%)",
      400: "hsl(330, 100%, 68%)",
      500: "hsl(330, 100%, 60%)",
      // Accent
      600: "hsl(330, 100%, 50%)",
      700: "hsl(330, 100%, 42%)",
      800: "hsl(330, 100%, 34%)",
      900: "hsl(330, 100%, 26%)"
    },
    green: {
      50: "hsl(145, 80%, 96%)",
      100: "hsl(145, 80%, 90%)",
      200: "hsl(145, 80%, 80%)",
      300: "hsl(145, 80%, 65%)",
      400: "hsl(145, 80%, 52%)",
      500: "hsl(145, 80%, 45%)",
      // Success
      600: "hsl(145, 80%, 36%)",
      700: "hsl(145, 80%, 28%)",
      800: "hsl(145, 80%, 20%)",
      900: "hsl(145, 80%, 12%)"
    },
    orange: {
      50: "hsl(35, 100%, 96%)",
      100: "hsl(35, 100%, 90%)",
      200: "hsl(35, 100%, 82%)",
      300: "hsl(35, 100%, 70%)",
      400: "hsl(35, 100%, 60%)",
      500: "hsl(35, 100%, 55%)",
      // Warning
      600: "hsl(35, 100%, 45%)",
      700: "hsl(35, 100%, 36%)",
      800: "hsl(35, 100%, 28%)",
      900: "hsl(35, 100%, 20%)"
    },
    red: {
      50: "hsl(0, 85%, 97%)",
      100: "hsl(0, 85%, 93%)",
      200: "hsl(0, 85%, 86%)",
      300: "hsl(0, 85%, 75%)",
      400: "hsl(0, 85%, 65%)",
      500: "hsl(0, 85%, 55%)",
      // Error
      600: "hsl(0, 85%, 46%)",
      700: "hsl(0, 85%, 38%)",
      800: "hsl(0, 85%, 30%)",
      900: "hsl(0, 85%, 22%)"
    },
    yellow: {
      50: "hsl(45, 100%, 96%)",
      100: "hsl(45, 100%, 90%)",
      200: "hsl(45, 100%, 80%)",
      300: "hsl(45, 100%, 68%)",
      400: "hsl(45, 100%, 56%)",
      500: "hsl(45, 100%, 50%)",
      // Celebration
      600: "hsl(45, 100%, 42%)",
      700: "hsl(45, 100%, 34%)",
      800: "hsl(45, 100%, 26%)",
      900: "hsl(45, 100%, 18%)"
    },
    gray: {
      50: "hsl(220, 14%, 98%)",
      100: "hsl(220, 14%, 96%)",
      200: "hsl(220, 13%, 91%)",
      300: "hsl(218, 12%, 83%)",
      400: "hsl(217, 10%, 65%)",
      500: "hsl(217, 9%, 50%)",
      600: "hsl(217, 9%, 40%)",
      700: "hsl(215, 11%, 30%)",
      800: "hsl(217, 14%, 18%)",
      900: "hsl(222, 47%, 11%)",
      950: "hsl(229, 84%, 5%)"
    },
    white: "hsl(0, 0%, 100%)",
    black: "hsl(0, 0%, 0%)"
  },
  spacing: {
    0: "0",
    px: "1px",
    0.5: "0.125rem",
    // 2px
    1: "0.25rem",
    // 4px
    1.5: "0.375rem",
    // 6px
    2: "0.5rem",
    // 8px
    2.5: "0.625rem",
    // 10px
    3: "0.75rem",
    // 12px
    3.5: "0.875rem",
    // 14px
    4: "1rem",
    // 16px
    5: "1.25rem",
    // 20px
    6: "1.5rem",
    // 24px
    7: "1.75rem",
    // 28px
    8: "2rem",
    // 32px
    9: "2.25rem",
    // 36px
    10: "2.5rem",
    // 40px
    11: "2.75rem",
    // 44px
    12: "3rem",
    // 48px
    14: "3.5rem",
    // 56px
    16: "4rem",
    // 64px
    20: "5rem",
    // 80px
    24: "6rem",
    // 96px
    28: "7rem",
    // 112px
    32: "8rem"
    // 128px
  },
  radius: {
    none: "0",
    sm: "0.25rem",
    // 4px
    md: "0.5rem",
    // 8px
    lg: "0.75rem",
    // 12px
    xl: "1rem",
    // 16px
    "2xl": "1.25rem",
    // 20px
    "3xl": "1.5rem",
    // 24px
    full: "9999px"
  },
  fontSize: {
    xs: "0.75rem",
    // 12px
    sm: "0.875rem",
    // 14px
    base: "1rem",
    // 16px
    lg: "1.125rem",
    // 18px
    xl: "1.25rem",
    // 20px
    "2xl": "1.5rem",
    // 24px
    "3xl": "1.875rem",
    // 30px
    "4xl": "2.25rem",
    // 36px
    "5xl": "3rem",
    // 48px
    "6xl": "3.75rem"
    // 60px
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2"
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800"
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
  },
  duration: {
    0: "0ms",
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1e3: "1000ms"
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    // Fun, bouncy easings (Duolingo-inspired)
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  },
  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50"
  }
};
var semantic = {
  colors: {
    // Brand
    brand: {
      primary: "var(--brand-primary)",
      primaryHover: "var(--brand-primary-hover)",
      primaryActive: "var(--brand-primary-active)",
      primarySubtle: "var(--brand-primary-subtle)",
      secondary: "var(--brand-secondary)",
      secondaryHover: "var(--brand-secondary-hover)",
      accent: "var(--brand-accent)",
      accentHover: "var(--brand-accent-hover)"
    },
    // Backgrounds
    background: {
      page: "var(--bg-page)",
      surface: "var(--bg-surface)",
      elevated: "var(--bg-elevated)",
      sunken: "var(--bg-sunken)",
      overlay: "var(--bg-overlay)",
      interactive: "var(--bg-interactive)",
      interactiveHover: "var(--bg-interactive-hover)",
      interactiveActive: "var(--bg-interactive-active)",
      success: "var(--bg-success)",
      successSubtle: "var(--bg-success-subtle)",
      warning: "var(--bg-warning)",
      warningSubtle: "var(--bg-warning-subtle)",
      error: "var(--bg-error)",
      errorSubtle: "var(--bg-error-subtle)",
      info: "var(--bg-info)",
      infoSubtle: "var(--bg-info-subtle)"
    },
    // Text
    text: {
      primary: "var(--text-primary)",
      secondary: "var(--text-secondary)",
      tertiary: "var(--text-tertiary)",
      muted: "var(--text-muted)",
      disabled: "var(--text-disabled)",
      heading: "var(--text-heading)",
      body: "var(--text-body)",
      caption: "var(--text-caption)",
      onPrimary: "var(--text-on-primary)",
      onSurface: "var(--text-on-surface)",
      onError: "var(--text-on-error)",
      link: "var(--text-link)",
      linkHover: "var(--text-link-hover)",
      success: "var(--text-success)",
      warning: "var(--text-warning)",
      error: "var(--text-error)"
    },
    // Borders
    border: {
      default: "var(--border-default)",
      strong: "var(--border-strong)",
      subtle: "var(--border-subtle)",
      focus: "var(--border-focus)",
      error: "var(--border-error)",
      success: "var(--border-success)"
    },
    // States
    state: {
      focusRing: "var(--state-focus-ring)",
      selection: "var(--state-selection)",
      highlight: "var(--state-highlight)"
    },
    // Fun/celebration colors (Duolingo/Discord inspired)
    fun: {
      celebration: "var(--fun-celebration)",
      achievement: "var(--fun-achievement)",
      streak: "var(--fun-streak)",
      party: "var(--fun-party)"
    }
  },
  // Typography
  typography: {
    heading: {
      display: {
        fontSize: "var(--font-size-display)",
        lineHeight: "var(--line-height-display)",
        fontWeight: "var(--font-weight-display)",
        letterSpacing: "var(--letter-spacing-display)"
      },
      h1: {
        fontSize: "var(--font-size-h1)",
        lineHeight: "var(--line-height-h1)",
        fontWeight: "var(--font-weight-h1)"
      },
      h2: {
        fontSize: "var(--font-size-h2)",
        lineHeight: "var(--line-height-h2)",
        fontWeight: "var(--font-weight-h2)"
      },
      h3: {
        fontSize: "var(--font-size-h3)",
        lineHeight: "var(--line-height-h3)",
        fontWeight: "var(--font-weight-h3)"
      },
      h4: {
        fontSize: "var(--font-size-h4)",
        lineHeight: "var(--line-height-h4)",
        fontWeight: "var(--font-weight-h4)"
      }
    },
    body: {
      lg: {
        fontSize: "var(--font-size-body-lg)",
        lineHeight: "var(--line-height-body-lg)"
      },
      md: {
        fontSize: "var(--font-size-body-md)",
        lineHeight: "var(--line-height-body-md)"
      },
      sm: {
        fontSize: "var(--font-size-body-sm)",
        lineHeight: "var(--line-height-body-sm)"
      },
      xs: {
        fontSize: "var(--font-size-body-xs)",
        lineHeight: "var(--line-height-body-xs)"
      }
    },
    ui: {
      label: {
        fontSize: "var(--font-size-label)",
        lineHeight: "var(--line-height-label)",
        fontWeight: "var(--font-weight-label)"
      },
      button: {
        fontSize: "var(--font-size-button)",
        lineHeight: "var(--line-height-button)",
        fontWeight: "var(--font-weight-button)"
      },
      caption: {
        fontSize: "var(--font-size-caption)",
        lineHeight: "var(--line-height-caption)"
      },
      overline: {
        fontSize: "var(--font-size-overline)",
        lineHeight: "var(--line-height-overline)",
        letterSpacing: "var(--letter-spacing-overline)",
        textTransform: "uppercase"
      },
      badge: {
        fontSize: "var(--font-size-badge)",
        lineHeight: "var(--line-height-badge)",
        fontWeight: "var(--font-weight-badge)"
      }
    },
    fontFamily: {
      sans: "var(--font-sans)",
      heading: "var(--font-heading)",
      mono: "var(--font-mono)"
    }
  },
  // Spacing (semantic purposes)
  spacing: {
    // Inset (padding)
    inset: {
      none: "0",
      xs: "var(--inset-xs)",
      // 4px
      sm: "var(--inset-sm)",
      // 8px
      md: "var(--inset-md)",
      // 16px
      lg: "var(--inset-lg)",
      // 24px
      xl: "var(--inset-xl)",
      // 32px
      "2xl": "var(--inset-2xl)"
      // 48px
    },
    // Stack (vertical gaps between elements)
    stack: {
      xs: "var(--stack-xs)",
      // 4px
      sm: "var(--stack-sm)",
      // 8px
      md: "var(--stack-md)",
      // 16px
      lg: "var(--stack-lg)",
      // 24px
      xl: "var(--stack-xl)",
      // 32px
      section: "var(--stack-section)"
      // 48px
    },
    // Inline (horizontal gaps)
    inline: {
      xs: "var(--inline-xs)",
      // 4px
      sm: "var(--inline-sm)",
      // 8px
      md: "var(--inline-md)",
      // 16px
      lg: "var(--inline-lg)"
      // 24px
    },
    // Layout
    layout: {
      pageMargin: "var(--layout-page-margin)",
      sectionGap: "var(--layout-section-gap)",
      containerPadding: "var(--layout-container-padding)"
    }
  },
  // Border Radius (dramatically rounded - Duolingo style)
  radius: {
    shape: {
      none: "0",
      subtle: "var(--shape-subtle)",
      // 8px
      soft: "var(--shape-soft)",
      // 16px
      rounded: "var(--shape-rounded)",
      // 20px
      pill: "var(--shape-pill)",
      // 9999px
      circle: "50%"
    },
    component: {
      button: "var(--radius-button)",
      // 16px - very rounded like Duolingo
      card: "var(--radius-card)",
      // 20px - friendly, approachable
      input: "var(--radius-input)",
      // 12px
      badge: "var(--radius-badge)",
      // pill
      avatar: "var(--radius-avatar)",
      // circle
      modal: "var(--radius-modal)",
      // 24px
      tooltip: "var(--radius-tooltip)",
      // 12px
      dropdown: "var(--radius-dropdown)",
      // 16px
      sheet: "var(--radius-sheet)"
      // 24px (top corners)
    }
  },
  // Shadows (elevation system)
  shadow: {
    elevation: {
      none: "none",
      raised: "var(--shadow-raised)",
      // Cards, buttons
      floating: "var(--shadow-floating)",
      // Dropdowns, popovers
      overlay: "var(--shadow-overlay)",
      // Modals, sheets
      popup: "var(--shadow-popup)"
      // Tooltips, toasts
    },
    fun: {
      pop: "var(--shadow-pop)",
      // Playful depth effect
      glow: "var(--shadow-glow)",
      // Colored glow around elements
      bounce: "var(--shadow-bounce)"
      // Pressed/active state shadow
    }
  },
  // Animation
  animation: {
    duration: {
      instant: "var(--duration-instant)",
      // 0ms
      micro: "var(--duration-micro)",
      // 100ms
      fast: "var(--duration-fast)",
      // 150ms
      normal: "var(--duration-normal)",
      // 200ms
      slow: "var(--duration-slow)",
      // 300ms
      slower: "var(--duration-slower)"
      // 500ms
    },
    easing: {
      default: "var(--easing-default)",
      enter: "var(--easing-enter)",
      exit: "var(--easing-exit)",
      bounce: "var(--easing-bounce)",
      spring: "var(--easing-spring)"
    }
  },
  // Z-Index
  zIndex: {
    // Local stacking (within components, use for relative positioning)
    lifted: "var(--z-lifted)",
    // 1 - Slightly above siblings
    float: "var(--z-float)",
    // 2 - Floating above local content
    top: "var(--z-top)",
    // 3 - Topmost in local context
    // Global stacking (for overlays, modals, etc.)
    base: "var(--z-base)",
    // 0
    dropdown: "var(--z-dropdown)",
    // 10
    sticky: "var(--z-sticky)",
    // 20
    modal: "var(--z-modal)",
    // 30
    popover: "var(--z-popover)",
    // 40
    toast: "var(--z-toast)",
    // 50
    tooltip: "var(--z-tooltip)",
    // 60
    overlay: "var(--z-overlay)"
    // 70
  }
};
var components = {
  button: {
    radius: semantic.radius.component.button,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    fontSize: semantic.typography.ui.button.fontSize,
    fontWeight: semantic.typography.ui.button.fontWeight,
    transition: `all ${primitives.duration[150]} ${primitives.easing.bounce}`,
    sizes: {
      sm: {
        height: "2rem",
        // 32px
        paddingX: semantic.spacing.inset.sm,
        fontSize: primitives.fontSize.sm
      },
      md: {
        height: "2.5rem",
        // 40px
        paddingX: semantic.spacing.inset.md,
        fontSize: primitives.fontSize.sm
      },
      lg: {
        height: "2.75rem",
        // 44px
        paddingX: semantic.spacing.inset.lg,
        fontSize: primitives.fontSize.base
      },
      icon: {
        size: "2.5rem",
        // 40px
        padding: semantic.spacing.inset.sm
      }
    }
  },
  card: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.raised,
    borderWidth: "1px",
    gap: semantic.spacing.stack.md
  },
  input: {
    radius: semantic.radius.component.input,
    paddingX: semantic.spacing.inset.md,
    paddingY: semantic.spacing.inset.sm,
    height: "2.5rem",
    // 40px
    fontSize: primitives.fontSize.sm,
    borderWidth: "1px",
    transition: `border-color ${primitives.duration[150]} ${primitives.easing.inOut}`
  },
  badge: {
    radius: semantic.radius.component.badge,
    paddingX: semantic.spacing.inset.sm,
    paddingY: semantic.spacing.inset.xs,
    fontSize: semantic.typography.ui.badge.fontSize,
    fontWeight: semantic.typography.ui.badge.fontWeight
  },
  avatar: {
    radius: semantic.radius.component.avatar,
    sizes: {
      xs: "1.5rem",
      // 24px
      sm: "2rem",
      // 32px
      md: "2.5rem",
      // 40px
      lg: "3rem",
      // 48px
      xl: "4rem",
      // 64px
      "2xl": "5rem"
      // 80px
    }
  },
  modal: {
    radius: semantic.radius.component.modal,
    padding: semantic.spacing.inset.xl,
    shadow: semantic.shadow.elevation.overlay,
    maxWidth: "32rem",
    // 512px
    gap: semantic.spacing.stack.lg
  },
  sheet: {
    radius: semantic.radius.component.sheet,
    padding: semantic.spacing.inset.lg,
    shadow: semantic.shadow.elevation.overlay
  },
  popover: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.sm,
    shadow: semantic.shadow.elevation.floating,
    minWidth: "8rem"
    // 128px
  },
  tooltip: {
    radius: semantic.radius.component.tooltip,
    padding: `${semantic.spacing.inset.xs} ${semantic.spacing.inset.sm}`,
    shadow: semantic.shadow.elevation.popup,
    fontSize: primitives.fontSize.sm
  },
  dropdown: {
    radius: semantic.radius.component.dropdown,
    padding: semantic.spacing.inset.xs,
    shadow: semantic.shadow.elevation.floating,
    itemPaddingX: semantic.spacing.inset.sm,
    itemPaddingY: semantic.spacing.inset.xs,
    itemRadius: semantic.radius.shape.subtle
  },
  tabs: {
    radius: semantic.radius.shape.subtle,
    padding: semantic.spacing.inset.sm,
    gap: semantic.spacing.inline.xs
  },
  checkbox: {
    size: "1rem",
    // 16px
    radius: primitives.radius.sm,
    // 4px
    borderWidth: "2px"
  },
  switch: {
    width: "2.75rem",
    // 44px
    height: "1.5rem",
    // 24px
    thumbSize: "1.25rem",
    // 20px
    radius: semantic.radius.shape.pill
  },
  progress: {
    height: "0.5rem",
    // 8px
    radius: semantic.radius.shape.pill
  },
  skeleton: {
    radius: semantic.radius.shape.subtle
  },
  alert: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    iconSize: "1.25rem"
    // 20px
  },
  toast: {
    radius: semantic.radius.component.card,
    padding: semantic.spacing.inset.md,
    shadow: semantic.shadow.elevation.popup
  }
};
var breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};
var colors = {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))"
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))"
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))"
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))"
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))"
  },
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))"
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))"
  },
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))"
};
var spacing = primitives.spacing;
var typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["Fira Code", "Monaco", "monospace"]
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }]
  },
  fontWeight: primitives.fontWeight
};
var borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px"
};
var shadows = primitives.shadows;
var animations = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms"
  },
  easing: {
    easeInOut: primitives.easing.inOut,
    easeOut: primitives.easing.out,
    easeIn: primitives.easing.in
  }
};

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
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export { animations, borderRadius, breakpoints, cn, colors, components, groupiDark, groupiLight, primitives, semantic, shadows, sharedTokens, spacing, themes, tokens, typography };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map