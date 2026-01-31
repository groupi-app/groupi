export { GroupiDarkTheme, GroupiLightTheme, SharedTokens, Theme, groupiDark, groupiLight, sharedTokens, themes, tokens } from './themes/index.js';
import { ClassValue } from 'clsx';

/**
 * Groupi Design Tokens
 * A three-layer token system: Primitives → Semantic → Component
 *
 * Inspired by Duolingo's fun-first, dramatically rounded aesthetic
 */
declare const primitives: {
    readonly colors: {
        readonly purple: {
            readonly 50: "hsl(285, 100%, 97%)";
            readonly 100: "hsl(285, 100%, 94%)";
            readonly 200: "hsl(285, 100%, 88%)";
            readonly 300: "hsl(285, 100%, 76%)";
            readonly 400: "hsl(285, 100%, 60%)";
            readonly 500: "hsl(285, 100%, 50%)";
            readonly 600: "hsl(285, 100%, 40%)";
            readonly 700: "hsl(285, 100%, 34%)";
            readonly 800: "hsl(285, 100%, 28%)";
            readonly 900: "hsl(285, 100%, 22%)";
            readonly 950: "hsl(285, 100%, 12%)";
        };
        readonly blue: {
            readonly 50: "hsl(210, 100%, 97%)";
            readonly 100: "hsl(210, 100%, 94%)";
            readonly 200: "hsl(210, 100%, 86%)";
            readonly 300: "hsl(210, 100%, 74%)";
            readonly 400: "hsl(210, 100%, 62%)";
            readonly 500: "hsl(210, 100%, 50%)";
            readonly 600: "hsl(210, 100%, 42%)";
            readonly 700: "hsl(210, 100%, 34%)";
            readonly 800: "hsl(210, 100%, 26%)";
            readonly 900: "hsl(210, 100%, 18%)";
        };
        readonly pink: {
            readonly 50: "hsl(330, 100%, 97%)";
            readonly 100: "hsl(330, 100%, 94%)";
            readonly 200: "hsl(330, 100%, 88%)";
            readonly 300: "hsl(330, 100%, 76%)";
            readonly 400: "hsl(330, 100%, 68%)";
            readonly 500: "hsl(330, 100%, 60%)";
            readonly 600: "hsl(330, 100%, 50%)";
            readonly 700: "hsl(330, 100%, 42%)";
            readonly 800: "hsl(330, 100%, 34%)";
            readonly 900: "hsl(330, 100%, 26%)";
        };
        readonly green: {
            readonly 50: "hsl(145, 80%, 96%)";
            readonly 100: "hsl(145, 80%, 90%)";
            readonly 200: "hsl(145, 80%, 80%)";
            readonly 300: "hsl(145, 80%, 65%)";
            readonly 400: "hsl(145, 80%, 52%)";
            readonly 500: "hsl(145, 80%, 45%)";
            readonly 600: "hsl(145, 80%, 36%)";
            readonly 700: "hsl(145, 80%, 28%)";
            readonly 800: "hsl(145, 80%, 20%)";
            readonly 900: "hsl(145, 80%, 12%)";
        };
        readonly orange: {
            readonly 50: "hsl(35, 100%, 96%)";
            readonly 100: "hsl(35, 100%, 90%)";
            readonly 200: "hsl(35, 100%, 82%)";
            readonly 300: "hsl(35, 100%, 70%)";
            readonly 400: "hsl(35, 100%, 60%)";
            readonly 500: "hsl(35, 100%, 55%)";
            readonly 600: "hsl(35, 100%, 45%)";
            readonly 700: "hsl(35, 100%, 36%)";
            readonly 800: "hsl(35, 100%, 28%)";
            readonly 900: "hsl(35, 100%, 20%)";
        };
        readonly red: {
            readonly 50: "hsl(0, 85%, 97%)";
            readonly 100: "hsl(0, 85%, 93%)";
            readonly 200: "hsl(0, 85%, 86%)";
            readonly 300: "hsl(0, 85%, 75%)";
            readonly 400: "hsl(0, 85%, 65%)";
            readonly 500: "hsl(0, 85%, 55%)";
            readonly 600: "hsl(0, 85%, 46%)";
            readonly 700: "hsl(0, 85%, 38%)";
            readonly 800: "hsl(0, 85%, 30%)";
            readonly 900: "hsl(0, 85%, 22%)";
        };
        readonly yellow: {
            readonly 50: "hsl(45, 100%, 96%)";
            readonly 100: "hsl(45, 100%, 90%)";
            readonly 200: "hsl(45, 100%, 80%)";
            readonly 300: "hsl(45, 100%, 68%)";
            readonly 400: "hsl(45, 100%, 56%)";
            readonly 500: "hsl(45, 100%, 50%)";
            readonly 600: "hsl(45, 100%, 42%)";
            readonly 700: "hsl(45, 100%, 34%)";
            readonly 800: "hsl(45, 100%, 26%)";
            readonly 900: "hsl(45, 100%, 18%)";
        };
        readonly gray: {
            readonly 50: "hsl(220, 14%, 98%)";
            readonly 100: "hsl(220, 14%, 96%)";
            readonly 200: "hsl(220, 13%, 91%)";
            readonly 300: "hsl(218, 12%, 83%)";
            readonly 400: "hsl(217, 10%, 65%)";
            readonly 500: "hsl(217, 9%, 50%)";
            readonly 600: "hsl(217, 9%, 40%)";
            readonly 700: "hsl(215, 11%, 30%)";
            readonly 800: "hsl(217, 14%, 18%)";
            readonly 900: "hsl(222, 47%, 11%)";
            readonly 950: "hsl(229, 84%, 5%)";
        };
        readonly white: "hsl(0, 0%, 100%)";
        readonly black: "hsl(0, 0%, 0%)";
    };
    readonly spacing: {
        readonly 0: "0";
        readonly px: "1px";
        readonly 0.5: "0.125rem";
        readonly 1: "0.25rem";
        readonly 1.5: "0.375rem";
        readonly 2: "0.5rem";
        readonly 2.5: "0.625rem";
        readonly 3: "0.75rem";
        readonly 3.5: "0.875rem";
        readonly 4: "1rem";
        readonly 5: "1.25rem";
        readonly 6: "1.5rem";
        readonly 7: "1.75rem";
        readonly 8: "2rem";
        readonly 9: "2.25rem";
        readonly 10: "2.5rem";
        readonly 11: "2.75rem";
        readonly 12: "3rem";
        readonly 14: "3.5rem";
        readonly 16: "4rem";
        readonly 20: "5rem";
        readonly 24: "6rem";
        readonly 28: "7rem";
        readonly 32: "8rem";
    };
    readonly radius: {
        readonly none: "0";
        readonly sm: "0.25rem";
        readonly md: "0.5rem";
        readonly lg: "0.75rem";
        readonly xl: "1rem";
        readonly '2xl': "1.25rem";
        readonly '3xl': "1.5rem";
        readonly full: "9999px";
    };
    readonly fontSize: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly base: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
        readonly '5xl': "3rem";
        readonly '6xl': "3.75rem";
    };
    readonly lineHeight: {
        readonly none: "1";
        readonly tight: "1.25";
        readonly snug: "1.375";
        readonly normal: "1.5";
        readonly relaxed: "1.625";
        readonly loose: "2";
    };
    readonly fontWeight: {
        readonly normal: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
        readonly extrabold: "800";
    };
    readonly shadows: {
        readonly none: "none";
        readonly sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
        readonly md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
        readonly lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
        readonly xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
        readonly '2xl': "0 25px 50px -12px rgb(0 0 0 / 0.25)";
        readonly inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)";
    };
    readonly duration: {
        readonly 0: "0ms";
        readonly 75: "75ms";
        readonly 100: "100ms";
        readonly 150: "150ms";
        readonly 200: "200ms";
        readonly 300: "300ms";
        readonly 500: "500ms";
        readonly 700: "700ms";
        readonly 1000: "1000ms";
    };
    readonly easing: {
        readonly linear: "linear";
        readonly in: "cubic-bezier(0.4, 0, 1, 1)";
        readonly out: "cubic-bezier(0, 0, 0.2, 1)";
        readonly inOut: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)";
        readonly spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        readonly elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    };
    readonly zIndex: {
        readonly 0: "0";
        readonly 10: "10";
        readonly 20: "20";
        readonly 30: "30";
        readonly 40: "40";
        readonly 50: "50";
    };
};
declare const semantic: {
    readonly colors: {
        readonly brand: {
            readonly primary: "var(--brand-primary)";
            readonly primaryHover: "var(--brand-primary-hover)";
            readonly primaryActive: "var(--brand-primary-active)";
            readonly primarySubtle: "var(--brand-primary-subtle)";
            readonly secondary: "var(--brand-secondary)";
            readonly secondaryHover: "var(--brand-secondary-hover)";
            readonly accent: "var(--brand-accent)";
            readonly accentHover: "var(--brand-accent-hover)";
        };
        readonly background: {
            readonly page: "var(--bg-page)";
            readonly surface: "var(--bg-surface)";
            readonly elevated: "var(--bg-elevated)";
            readonly sunken: "var(--bg-sunken)";
            readonly overlay: "var(--bg-overlay)";
            readonly interactive: "var(--bg-interactive)";
            readonly interactiveHover: "var(--bg-interactive-hover)";
            readonly interactiveActive: "var(--bg-interactive-active)";
            readonly success: "var(--bg-success)";
            readonly successSubtle: "var(--bg-success-subtle)";
            readonly warning: "var(--bg-warning)";
            readonly warningSubtle: "var(--bg-warning-subtle)";
            readonly error: "var(--bg-error)";
            readonly errorSubtle: "var(--bg-error-subtle)";
            readonly info: "var(--bg-info)";
            readonly infoSubtle: "var(--bg-info-subtle)";
        };
        readonly text: {
            readonly primary: "var(--text-primary)";
            readonly secondary: "var(--text-secondary)";
            readonly tertiary: "var(--text-tertiary)";
            readonly muted: "var(--text-muted)";
            readonly disabled: "var(--text-disabled)";
            readonly heading: "var(--text-heading)";
            readonly body: "var(--text-body)";
            readonly caption: "var(--text-caption)";
            readonly onPrimary: "var(--text-on-primary)";
            readonly onSurface: "var(--text-on-surface)";
            readonly onError: "var(--text-on-error)";
            readonly link: "var(--text-link)";
            readonly linkHover: "var(--text-link-hover)";
            readonly success: "var(--text-success)";
            readonly warning: "var(--text-warning)";
            readonly error: "var(--text-error)";
        };
        readonly border: {
            readonly default: "var(--border-default)";
            readonly strong: "var(--border-strong)";
            readonly subtle: "var(--border-subtle)";
            readonly focus: "var(--border-focus)";
            readonly error: "var(--border-error)";
            readonly success: "var(--border-success)";
        };
        readonly state: {
            readonly focusRing: "var(--state-focus-ring)";
            readonly selection: "var(--state-selection)";
            readonly highlight: "var(--state-highlight)";
        };
        readonly fun: {
            readonly celebration: "var(--fun-celebration)";
            readonly achievement: "var(--fun-achievement)";
            readonly streak: "var(--fun-streak)";
            readonly party: "var(--fun-party)";
        };
    };
    readonly typography: {
        readonly heading: {
            readonly display: {
                readonly fontSize: "var(--font-size-display)";
                readonly lineHeight: "var(--line-height-display)";
                readonly fontWeight: "var(--font-weight-display)";
                readonly letterSpacing: "var(--letter-spacing-display)";
            };
            readonly h1: {
                readonly fontSize: "var(--font-size-h1)";
                readonly lineHeight: "var(--line-height-h1)";
                readonly fontWeight: "var(--font-weight-h1)";
            };
            readonly h2: {
                readonly fontSize: "var(--font-size-h2)";
                readonly lineHeight: "var(--line-height-h2)";
                readonly fontWeight: "var(--font-weight-h2)";
            };
            readonly h3: {
                readonly fontSize: "var(--font-size-h3)";
                readonly lineHeight: "var(--line-height-h3)";
                readonly fontWeight: "var(--font-weight-h3)";
            };
            readonly h4: {
                readonly fontSize: "var(--font-size-h4)";
                readonly lineHeight: "var(--line-height-h4)";
                readonly fontWeight: "var(--font-weight-h4)";
            };
        };
        readonly body: {
            readonly lg: {
                readonly fontSize: "var(--font-size-body-lg)";
                readonly lineHeight: "var(--line-height-body-lg)";
            };
            readonly md: {
                readonly fontSize: "var(--font-size-body-md)";
                readonly lineHeight: "var(--line-height-body-md)";
            };
            readonly sm: {
                readonly fontSize: "var(--font-size-body-sm)";
                readonly lineHeight: "var(--line-height-body-sm)";
            };
            readonly xs: {
                readonly fontSize: "var(--font-size-body-xs)";
                readonly lineHeight: "var(--line-height-body-xs)";
            };
        };
        readonly ui: {
            readonly label: {
                readonly fontSize: "var(--font-size-label)";
                readonly lineHeight: "var(--line-height-label)";
                readonly fontWeight: "var(--font-weight-label)";
            };
            readonly button: {
                readonly fontSize: "var(--font-size-button)";
                readonly lineHeight: "var(--line-height-button)";
                readonly fontWeight: "var(--font-weight-button)";
            };
            readonly caption: {
                readonly fontSize: "var(--font-size-caption)";
                readonly lineHeight: "var(--line-height-caption)";
            };
            readonly overline: {
                readonly fontSize: "var(--font-size-overline)";
                readonly lineHeight: "var(--line-height-overline)";
                readonly letterSpacing: "var(--letter-spacing-overline)";
                readonly textTransform: "uppercase";
            };
            readonly badge: {
                readonly fontSize: "var(--font-size-badge)";
                readonly lineHeight: "var(--line-height-badge)";
                readonly fontWeight: "var(--font-weight-badge)";
            };
        };
        readonly fontFamily: {
            readonly sans: "var(--font-sans)";
            readonly heading: "var(--font-heading)";
            readonly mono: "var(--font-mono)";
        };
    };
    readonly spacing: {
        readonly inset: {
            readonly none: "0";
            readonly xs: "var(--inset-xs)";
            readonly sm: "var(--inset-sm)";
            readonly md: "var(--inset-md)";
            readonly lg: "var(--inset-lg)";
            readonly xl: "var(--inset-xl)";
            readonly '2xl': "var(--inset-2xl)";
        };
        readonly stack: {
            readonly xs: "var(--stack-xs)";
            readonly sm: "var(--stack-sm)";
            readonly md: "var(--stack-md)";
            readonly lg: "var(--stack-lg)";
            readonly xl: "var(--stack-xl)";
            readonly section: "var(--stack-section)";
        };
        readonly inline: {
            readonly xs: "var(--inline-xs)";
            readonly sm: "var(--inline-sm)";
            readonly md: "var(--inline-md)";
            readonly lg: "var(--inline-lg)";
        };
        readonly layout: {
            readonly pageMargin: "var(--layout-page-margin)";
            readonly sectionGap: "var(--layout-section-gap)";
            readonly containerPadding: "var(--layout-container-padding)";
        };
    };
    readonly radius: {
        readonly shape: {
            readonly none: "0";
            readonly subtle: "var(--shape-subtle)";
            readonly soft: "var(--shape-soft)";
            readonly rounded: "var(--shape-rounded)";
            readonly pill: "var(--shape-pill)";
            readonly circle: "50%";
        };
        readonly component: {
            readonly button: "var(--radius-button)";
            readonly card: "var(--radius-card)";
            readonly input: "var(--radius-input)";
            readonly badge: "var(--radius-badge)";
            readonly avatar: "var(--radius-avatar)";
            readonly modal: "var(--radius-modal)";
            readonly tooltip: "var(--radius-tooltip)";
            readonly dropdown: "var(--radius-dropdown)";
            readonly sheet: "var(--radius-sheet)";
        };
    };
    readonly shadow: {
        readonly elevation: {
            readonly none: "none";
            readonly raised: "var(--shadow-raised)";
            readonly floating: "var(--shadow-floating)";
            readonly overlay: "var(--shadow-overlay)";
            readonly popup: "var(--shadow-popup)";
        };
        readonly fun: {
            readonly pop: "var(--shadow-pop)";
            readonly glow: "var(--shadow-glow)";
            readonly bounce: "var(--shadow-bounce)";
        };
    };
    readonly animation: {
        readonly duration: {
            readonly instant: "var(--duration-instant)";
            readonly micro: "var(--duration-micro)";
            readonly fast: "var(--duration-fast)";
            readonly normal: "var(--duration-normal)";
            readonly slow: "var(--duration-slow)";
            readonly slower: "var(--duration-slower)";
        };
        readonly easing: {
            readonly default: "var(--easing-default)";
            readonly enter: "var(--easing-enter)";
            readonly exit: "var(--easing-exit)";
            readonly bounce: "var(--easing-bounce)";
            readonly spring: "var(--easing-spring)";
        };
    };
    readonly zIndex: {
        readonly lifted: "var(--z-lifted)";
        readonly float: "var(--z-float)";
        readonly top: "var(--z-top)";
        readonly base: "var(--z-base)";
        readonly dropdown: "var(--z-dropdown)";
        readonly sticky: "var(--z-sticky)";
        readonly modal: "var(--z-modal)";
        readonly popover: "var(--z-popover)";
        readonly toast: "var(--z-toast)";
        readonly tooltip: "var(--z-tooltip)";
        readonly overlay: "var(--z-overlay)";
    };
};
declare const components: {
    readonly button: {
        readonly radius: "var(--radius-button)";
        readonly paddingX: "var(--inset-md)";
        readonly paddingY: "var(--inset-sm)";
        readonly fontSize: "var(--font-size-button)";
        readonly fontWeight: "var(--font-weight-button)";
        readonly transition: "all 150ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        readonly sizes: {
            readonly sm: {
                readonly height: "2rem";
                readonly paddingX: "var(--inset-sm)";
                readonly fontSize: "0.875rem";
            };
            readonly md: {
                readonly height: "2.5rem";
                readonly paddingX: "var(--inset-md)";
                readonly fontSize: "0.875rem";
            };
            readonly lg: {
                readonly height: "2.75rem";
                readonly paddingX: "var(--inset-lg)";
                readonly fontSize: "1rem";
            };
            readonly icon: {
                readonly size: "2.5rem";
                readonly padding: "var(--inset-sm)";
            };
        };
    };
    readonly card: {
        readonly radius: "var(--radius-card)";
        readonly padding: "var(--inset-lg)";
        readonly shadow: "var(--shadow-raised)";
        readonly borderWidth: "1px";
        readonly gap: "var(--stack-md)";
    };
    readonly input: {
        readonly radius: "var(--radius-input)";
        readonly paddingX: "var(--inset-md)";
        readonly paddingY: "var(--inset-sm)";
        readonly height: "2.5rem";
        readonly fontSize: "0.875rem";
        readonly borderWidth: "1px";
        readonly transition: "border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly badge: {
        readonly radius: "var(--radius-badge)";
        readonly paddingX: "var(--inset-sm)";
        readonly paddingY: "var(--inset-xs)";
        readonly fontSize: "var(--font-size-badge)";
        readonly fontWeight: "var(--font-weight-badge)";
    };
    readonly avatar: {
        readonly radius: "var(--radius-avatar)";
        readonly sizes: {
            readonly xs: "1.5rem";
            readonly sm: "2rem";
            readonly md: "2.5rem";
            readonly lg: "3rem";
            readonly xl: "4rem";
            readonly '2xl': "5rem";
        };
    };
    readonly modal: {
        readonly radius: "var(--radius-modal)";
        readonly padding: "var(--inset-xl)";
        readonly shadow: "var(--shadow-overlay)";
        readonly maxWidth: "32rem";
        readonly gap: "var(--stack-lg)";
    };
    readonly sheet: {
        readonly radius: "var(--radius-sheet)";
        readonly padding: "var(--inset-lg)";
        readonly shadow: "var(--shadow-overlay)";
    };
    readonly popover: {
        readonly radius: "var(--radius-dropdown)";
        readonly padding: "var(--inset-sm)";
        readonly shadow: "var(--shadow-floating)";
        readonly minWidth: "8rem";
    };
    readonly tooltip: {
        readonly radius: "var(--radius-tooltip)";
        readonly padding: "var(--inset-xs) var(--inset-sm)";
        readonly shadow: "var(--shadow-popup)";
        readonly fontSize: "0.875rem";
    };
    readonly dropdown: {
        readonly radius: "var(--radius-dropdown)";
        readonly padding: "var(--inset-xs)";
        readonly shadow: "var(--shadow-floating)";
        readonly itemPaddingX: "var(--inset-sm)";
        readonly itemPaddingY: "var(--inset-xs)";
        readonly itemRadius: "var(--shape-subtle)";
    };
    readonly tabs: {
        readonly radius: "var(--shape-subtle)";
        readonly padding: "var(--inset-sm)";
        readonly gap: "var(--inline-xs)";
    };
    readonly checkbox: {
        readonly size: "1rem";
        readonly radius: "0.25rem";
        readonly borderWidth: "2px";
    };
    readonly switch: {
        readonly width: "2.75rem";
        readonly height: "1.5rem";
        readonly thumbSize: "1.25rem";
        readonly radius: "var(--shape-pill)";
    };
    readonly progress: {
        readonly height: "0.5rem";
        readonly radius: "var(--shape-pill)";
    };
    readonly skeleton: {
        readonly radius: "var(--shape-subtle)";
    };
    readonly alert: {
        readonly radius: "var(--radius-card)";
        readonly padding: "var(--inset-md)";
        readonly iconSize: "1.25rem";
    };
    readonly toast: {
        readonly radius: "var(--radius-card)";
        readonly padding: "var(--inset-md)";
        readonly shadow: "var(--shadow-popup)";
    };
};
declare const breakpoints: {
    readonly sm: "640px";
    readonly md: "768px";
    readonly lg: "1024px";
    readonly xl: "1280px";
    readonly '2xl': "1536px";
};
type Primitives = typeof primitives;
type Semantic = typeof semantic;
type Components = typeof components;
type Breakpoints = typeof breakpoints;
type PrimitiveColor = keyof typeof primitives.colors;
type SemanticColor = keyof typeof semantic.colors;
type BrandColor = keyof typeof semantic.colors.brand;
type BackgroundColor = keyof typeof semantic.colors.background;
type TextColor = keyof typeof semantic.colors.text;
type BorderColor = keyof typeof semantic.colors.border;
type InsetSpacing = keyof typeof semantic.spacing.inset;
type StackSpacing = keyof typeof semantic.spacing.stack;
type InlineSpacing = keyof typeof semantic.spacing.inline;
type ShapeRadius = keyof typeof semantic.radius.shape;
type ComponentRadius = keyof typeof semantic.radius.component;
type ElevationShadow = keyof typeof semantic.shadow.elevation;
type FunShadow = keyof typeof semantic.shadow.fun;
type AnimationDuration = keyof typeof semantic.animation.duration;
type AnimationEasing = keyof typeof semantic.animation.easing;
/** @deprecated Use semantic.colors instead */
declare const colors: {
    readonly primary: {
        readonly DEFAULT: "hsl(var(--primary))";
        readonly foreground: "hsl(var(--primary-foreground))";
    };
    readonly secondary: {
        readonly DEFAULT: "hsl(var(--secondary))";
        readonly foreground: "hsl(var(--secondary-foreground))";
    };
    readonly destructive: {
        readonly DEFAULT: "hsl(var(--destructive))";
        readonly foreground: "hsl(var(--destructive-foreground))";
    };
    readonly muted: {
        readonly DEFAULT: "hsl(var(--muted))";
        readonly foreground: "hsl(var(--muted-foreground))";
    };
    readonly accent: {
        readonly DEFAULT: "hsl(var(--accent))";
        readonly foreground: "hsl(var(--accent-foreground))";
    };
    readonly background: "hsl(var(--background))";
    readonly foreground: "hsl(var(--foreground))";
    readonly card: {
        readonly DEFAULT: "hsl(var(--card))";
        readonly foreground: "hsl(var(--card-foreground))";
    };
    readonly popover: {
        readonly DEFAULT: "hsl(var(--popover))";
        readonly foreground: "hsl(var(--popover-foreground))";
    };
    readonly border: "hsl(var(--border))";
    readonly input: "hsl(var(--input))";
    readonly ring: "hsl(var(--ring))";
};
/** @deprecated Use primitives.spacing instead */
declare const spacing: {
    readonly 0: "0";
    readonly px: "1px";
    readonly 0.5: "0.125rem";
    readonly 1: "0.25rem";
    readonly 1.5: "0.375rem";
    readonly 2: "0.5rem";
    readonly 2.5: "0.625rem";
    readonly 3: "0.75rem";
    readonly 3.5: "0.875rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 7: "1.75rem";
    readonly 8: "2rem";
    readonly 9: "2.25rem";
    readonly 10: "2.5rem";
    readonly 11: "2.75rem";
    readonly 12: "3rem";
    readonly 14: "3.5rem";
    readonly 16: "4rem";
    readonly 20: "5rem";
    readonly 24: "6rem";
    readonly 28: "7rem";
    readonly 32: "8rem";
};
/** @deprecated Use semantic.typography instead */
declare const typography: {
    readonly fontFamily: {
        readonly sans: readonly ["Inter", "system-ui", "sans-serif"];
        readonly mono: readonly ["Fira Code", "Monaco", "monospace"];
    };
    readonly fontSize: {
        readonly xs: readonly ["0.75rem", {
            readonly lineHeight: "1rem";
        }];
        readonly sm: readonly ["0.875rem", {
            readonly lineHeight: "1.25rem";
        }];
        readonly base: readonly ["1rem", {
            readonly lineHeight: "1.5rem";
        }];
        readonly lg: readonly ["1.125rem", {
            readonly lineHeight: "1.75rem";
        }];
        readonly xl: readonly ["1.25rem", {
            readonly lineHeight: "1.75rem";
        }];
        readonly '2xl': readonly ["1.5rem", {
            readonly lineHeight: "2rem";
        }];
        readonly '3xl': readonly ["1.875rem", {
            readonly lineHeight: "2.25rem";
        }];
        readonly '4xl': readonly ["2.25rem", {
            readonly lineHeight: "2.5rem";
        }];
    };
    readonly fontWeight: {
        readonly normal: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
        readonly extrabold: "800";
    };
};
/** @deprecated Use semantic.radius instead */
declare const borderRadius: {
    readonly none: "0";
    readonly sm: "0.125rem";
    readonly DEFAULT: "0.25rem";
    readonly md: "0.375rem";
    readonly lg: "0.5rem";
    readonly xl: "0.75rem";
    readonly '2xl': "1rem";
    readonly full: "9999px";
};
/** @deprecated Use semantic.shadow instead */
declare const shadows: {
    readonly none: "none";
    readonly sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    readonly md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
    readonly lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    readonly xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
    readonly '2xl': "0 25px 50px -12px rgb(0 0 0 / 0.25)";
    readonly inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)";
};
/** @deprecated Use semantic.animation instead */
declare const animations: {
    readonly duration: {
        readonly fast: "150ms";
        readonly normal: "250ms";
        readonly slow: "350ms";
    };
    readonly easing: {
        readonly easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
        readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
    };
};

declare function cn(...inputs: ClassValue[]): string;

export { type AnimationDuration, type AnimationEasing, type BackgroundColor, type BorderColor, type BrandColor, type Breakpoints, type ComponentRadius, type Components, type ElevationShadow, type FunShadow, type InlineSpacing, type InsetSpacing, type PrimitiveColor, type Primitives, type Semantic, type SemanticColor, type ShapeRadius, type StackSpacing, type TextColor, animations, borderRadius, breakpoints, cn, colors, components, primitives, semantic, shadows, spacing, typography };
