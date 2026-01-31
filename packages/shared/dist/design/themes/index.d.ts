/**
 * Theme System Type Definitions
 *
 * Defines the structure for base themes and custom themes.
 * This is the single source of truth for theme-related types.
 */
/**
 * Brand color tokens - Primary identity colors
 */
interface BrandTokens {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primarySubtle: string;
    secondary: string;
    secondaryHover: string;
    accent: string;
    accentHover: string;
}
/**
 * Background color tokens - Surface and container colors
 */
interface BackgroundTokens {
    page: string;
    surface: string;
    elevated: string;
    sunken: string;
    overlay: string;
    interactive: string;
    interactiveHover: string;
    interactiveActive: string;
    success: string;
    successSubtle: string;
    warning: string;
    warningSubtle: string;
    error: string;
    errorSubtle: string;
    info: string;
    infoSubtle: string;
}
/**
 * Text color tokens - Typography colors
 */
interface TextTokens {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    disabled: string;
    heading: string;
    body: string;
    caption: string;
    onPrimary: string;
    onSurface: string;
    onError: string;
    link: string;
    linkHover: string;
    success: string;
    warning: string;
    error: string;
}
/**
 * Border color tokens
 */
interface BorderTokens {
    default: string;
    strong: string;
    subtle: string;
    focus: string;
    error: string;
    success: string;
}
/**
 * State color tokens - Interactive states
 */
interface StateTokens {
    focusRing: string;
    selection: string;
    highlight: string;
}
/**
 * Fun/celebration color tokens - Gamification (Duolingo-inspired)
 */
interface FunTokens {
    celebration: string;
    achievement: string;
    streak: string;
    party: string;
}
/**
 * Shadow tokens - Elevation levels
 */
interface ShadowTokens {
    raised: string;
    floating: string;
    overlay: string;
    popup: string;
    pop: string;
    glow: string;
    bounce: string;
}
/**
 * Legacy tokens for shadcn/ui backwards compatibility
 */
interface LegacyTokens {
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    popover: string;
    popoverForeground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    ring: string;
    radius: string;
}
/**
 * Complete theme tokens structure
 */
interface ThemeTokens {
    brand: BrandTokens;
    background: BackgroundTokens;
    text: TextTokens;
    border: BorderTokens;
    state: StateTokens;
    fun: FunTokens;
    shadow: ShadowTokens;
    legacy: LegacyTokens;
}
/**
 * Theme mode - used for system preference matching
 */
type ThemeMode = 'light' | 'dark';
/**
 * Preview colors for theme picker cards
 */
interface ThemePreview {
    /** Primary brand color */
    primary: string;
    /** Page background color */
    background: string;
    /** Accent color */
    accent: string;
}
/**
 * Base theme definition - pre-built themes shipped with the app
 */
interface BaseTheme {
    /** Unique identifier (e.g., 'groupi-light', 'ocean-dark') */
    id: string;
    /** Display name (e.g., 'Groupi Light') */
    name: string;
    /** Brief description */
    description: string;
    /** Light or dark mode for system preference matching */
    mode: ThemeMode;
    /** Preview colors for theme picker cards */
    preview: ThemePreview;
    /** Full theme token values */
    tokens: ThemeTokens;
}
/**
 * Theme registry - all available base themes
 */
type ThemeRegistry = Record<string, BaseTheme>;
/**
 * Editable token categories for custom themes
 * These are a curated subset of tokens that users can customize
 */
interface EditableBrandTokens {
    primary?: string;
    secondary?: string;
    accent?: string;
}
interface EditableBackgroundTokens {
    page?: string;
    surface?: string;
    elevated?: string;
    sunken?: string;
}
interface EditableTextTokens {
    primary?: string;
    secondary?: string;
    heading?: string;
    muted?: string;
}
interface EditableStatusTokens {
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
}
interface EditableShadowTokens {
    raised?: string;
    floating?: string;
}
/**
 * Token overrides for custom themes
 * Only stores the tokens that differ from the base theme
 */
interface ThemeTokenOverrides {
    brand?: EditableBrandTokens;
    background?: EditableBackgroundTokens;
    text?: EditableTextTokens;
    status?: EditableStatusTokens;
    shadow?: EditableShadowTokens;
}
/**
 * Custom theme definition - user-created themes stored in database
 */
interface CustomTheme {
    /** Database ID */
    id: string;
    /** Owner's person ID */
    personId: string;
    /** Display name */
    name: string;
    /** Optional description */
    description?: string;
    /** Base theme this extends */
    baseThemeId: string;
    /** Light or dark mode (inherited from base) */
    mode: ThemeMode;
    /** Token overrides (only stores differences from base) */
    tokenOverrides: ThemeTokenOverrides;
    /** Creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
}
/**
 * Theme selection type
 */
type ThemeSelectionType = 'base' | 'custom';
/**
 * User theme preferences stored in database
 */
interface ThemePreferences {
    /** Type of selected theme */
    selectedThemeType: ThemeSelectionType;
    /** Selected base theme ID */
    selectedThemeId: string;
    /** Selected custom theme ID (if type is 'custom') */
    selectedCustomThemeId?: string;
    /** Whether to use system preference for auto-switching */
    useSystemPreference: boolean;
    /** Base theme to use when system is in light mode */
    systemLightThemeId: string;
    /** Base theme to use when system is in dark mode */
    systemDarkThemeId: string;
}
/**
 * Theme editor state for undo/redo
 */
interface ThemeEditorState {
    /** Base theme being extended */
    baseThemeId: string;
    /** Current token overrides */
    tokenOverrides: ThemeTokenOverrides;
    /** History for undo */
    history: ThemeTokenOverrides[];
    /** Current position in history */
    historyIndex: number;
    /** Whether there are unsaved changes */
    isDirty: boolean;
}
/**
 * Editable token category names
 */
type EditableTokenCategory = 'brand' | 'background' | 'text' | 'status' | 'fun' | 'shadow';
/**
 * Token definition for the editor
 */
interface EditableTokenDef {
    /** Token key within category */
    key: string;
    /** Display label */
    label: string;
    /** Help text */
    description?: string;
    /** CSS variable name */
    cssVar: string;
}
/**
 * Category definition for the editor
 */
interface EditableTokenCategoryDef {
    /** Category key */
    key: EditableTokenCategory;
    /** Display label */
    label: string;
    /** User-friendly name */
    friendlyName: string;
    /** Category description */
    description: string;
    /** Tokens in this category */
    tokens: EditableTokenDef[];
}

/**
 * Groupi Light Theme
 *
 * All design token values for the light theme.
 * This is the single source of truth for token values.
 */
declare const groupiLight: {
    readonly brand: {
        readonly primary: "hsl(285, 100%, 34%)";
        readonly primaryHover: "hsl(285, 100%, 28%)";
        readonly primaryActive: "hsl(285, 100%, 24%)";
        readonly primarySubtle: "hsl(285, 100%, 94%)";
        readonly secondary: "hsl(210, 100%, 50%)";
        readonly secondaryHover: "hsl(210, 100%, 42%)";
        readonly accent: "hsl(330, 100%, 60%)";
        readonly accentHover: "hsl(330, 100%, 50%)";
    };
    readonly background: {
        readonly page: "hsl(0, 0%, 100%)";
        readonly surface: "hsl(0, 0%, 100%)";
        readonly elevated: "hsl(0, 0%, 100%)";
        readonly sunken: "hsl(220, 14%, 96%)";
        readonly overlay: "hsl(0, 0%, 0%, 0.5)";
        readonly interactive: "hsl(220, 14%, 96%)";
        readonly interactiveHover: "hsl(220, 13%, 91%)";
        readonly interactiveActive: "hsl(218, 12%, 83%)";
        readonly success: "hsl(145, 80%, 45%)";
        readonly successSubtle: "hsl(145, 80%, 90%)";
        readonly warning: "hsl(35, 100%, 55%)";
        readonly warningSubtle: "hsl(35, 100%, 90%)";
        readonly error: "hsl(0, 85%, 55%)";
        readonly errorSubtle: "hsl(0, 85%, 93%)";
        readonly info: "hsl(210, 100%, 50%)";
        readonly infoSubtle: "hsl(210, 100%, 94%)";
    };
    readonly text: {
        readonly primary: "hsl(222.2, 47.4%, 11.2%)";
        readonly secondary: "hsl(217, 9%, 40%)";
        readonly tertiary: "hsl(217, 10%, 50%)";
        readonly muted: "hsl(215.4, 16.3%, 46.9%)";
        readonly disabled: "hsl(217, 10%, 65%)";
        readonly heading: "hsl(222.2, 47.4%, 11.2%)";
        readonly body: "hsl(222.2, 47.4%, 11.2%)";
        readonly caption: "hsl(217, 9%, 40%)";
        readonly onPrimary: "hsl(0, 0%, 100%)";
        readonly onSurface: "hsl(222.2, 47.4%, 11.2%)";
        readonly onError: "hsl(0, 0%, 100%)";
        readonly link: "hsl(285, 100%, 34%)";
        readonly linkHover: "hsl(285, 100%, 28%)";
        readonly success: "hsl(145, 80%, 28%)";
        readonly warning: "hsl(35, 100%, 36%)";
        readonly error: "hsl(0, 85%, 46%)";
    };
    readonly border: {
        readonly default: "hsl(214.3, 31.8%, 91.4%)";
        readonly strong: "hsl(218, 12%, 83%)";
        readonly subtle: "hsl(220, 13%, 95%)";
        readonly focus: "hsl(285, 100%, 34%)";
        readonly error: "hsl(0, 85%, 55%)";
        readonly success: "hsl(145, 80%, 45%)";
    };
    readonly state: {
        readonly focusRing: "hsl(285, 100%, 34%, 0.4)";
        readonly selection: "hsl(285, 100%, 34%, 0.15)";
        readonly highlight: "hsl(45, 100%, 50%, 0.2)";
    };
    readonly fun: {
        readonly celebration: "hsl(45, 100%, 50%)";
        readonly achievement: "hsl(145, 80%, 45%)";
        readonly streak: "hsl(25, 100%, 55%)";
        readonly party: "hsl(330, 100%, 60%)";
    };
    readonly shadow: {
        readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
        readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
        readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
        readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
        readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.1)";
        readonly glow: "0 0 20px 0 hsl(285 100% 34% / 0.3)";
        readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.1)";
    };
    readonly legacy: {
        readonly background: "hsl(0, 0%, 100%)";
        readonly foreground: "hsl(222.2, 47.4%, 11.2%)";
        readonly muted: "hsl(210, 40%, 96.1%)";
        readonly mutedForeground: "hsl(215.4, 16.3%, 46.9%)";
        readonly popover: "hsl(0, 0%, 100%)";
        readonly popoverForeground: "hsl(222.2, 47.4%, 11.2%)";
        readonly card: "hsl(0, 0%, 100%)";
        readonly cardForeground: "hsl(222.2, 47.4%, 11.2%)";
        readonly border: "hsl(214.3, 31.8%, 91.4%)";
        readonly input: "hsl(214.3, 31.8%, 91.4%)";
        readonly primary: "hsl(285, 100%, 34%)";
        readonly primaryForeground: "hsl(210, 40%, 98%)";
        readonly secondary: "hsl(210, 40%, 96.1%)";
        readonly secondaryForeground: "hsl(222.2, 47.4%, 11.2%)";
        readonly accent: "hsl(260, 40%, 96.1%)";
        readonly accentForeground: "hsl(273.2, 47.4%, 11.2%)";
        readonly destructive: "hsl(0, 85%, 55%)";
        readonly destructiveForeground: "hsl(210, 40%, 98%)";
        readonly ring: "hsl(215, 20.2%, 65.1%)";
        readonly radius: "0.5rem";
    };
};
declare const sharedTokens: {
    readonly spacing: {
        readonly inset: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
            readonly xl: "2rem";
            readonly '2xl': "3rem";
        };
        readonly stack: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
            readonly xl: "2rem";
            readonly section: "3rem";
        };
        readonly inline: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
        };
        readonly layout: {
            readonly pageMargin: "1rem";
            readonly sectionGap: "3rem";
            readonly containerPadding: "2rem";
        };
    };
    readonly radius: {
        readonly shape: {
            readonly subtle: "0.5rem";
            readonly soft: "1rem";
            readonly rounded: "1.25rem";
            readonly pill: "9999px";
        };
        readonly component: {
            readonly button: "1rem";
            readonly card: "1.25rem";
            readonly input: "0.75rem";
            readonly badge: "9999px";
            readonly avatar: "50%";
            readonly modal: "1.5rem";
            readonly tooltip: "0.75rem";
            readonly dropdown: "1rem";
            readonly sheet: "1.5rem";
        };
    };
    readonly duration: {
        readonly instant: "0ms";
        readonly micro: "100ms";
        readonly fast: "150ms";
        readonly normal: "200ms";
        readonly slow: "300ms";
        readonly slower: "500ms";
    };
    readonly easing: {
        readonly default: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly enter: "cubic-bezier(0, 0, 0.2, 1)";
        readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
        readonly bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)";
        readonly spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    };
    readonly zIndex: {
        readonly lifted: 1;
        readonly float: 2;
        readonly top: 3;
        readonly base: 0;
        readonly sticky: 40;
        readonly popover: 50;
        readonly dropdown: 60;
        readonly modal: 70;
        readonly toast: 80;
        readonly tooltip: 90;
        readonly overlay: 100;
    };
    readonly typography: {
        readonly fontFamily: {
            readonly sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif";
            readonly mono: "\"Fira Code\", ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace";
        };
        readonly fontSize: {
            readonly display: "3rem";
            readonly h1: "2.25rem";
            readonly h2: "1.875rem";
            readonly h3: "1.5rem";
            readonly h4: "1.25rem";
            readonly bodyLg: "1.125rem";
            readonly bodyMd: "1rem";
            readonly bodySm: "0.875rem";
            readonly bodyXs: "0.75rem";
            readonly label: "0.875rem";
            readonly button: "0.875rem";
            readonly caption: "0.75rem";
            readonly overline: "0.75rem";
            readonly badge: "0.75rem";
        };
        readonly lineHeight: {
            readonly display: "1.1";
            readonly h1: "1.2";
            readonly h2: "1.3";
            readonly h3: "1.4";
            readonly h4: "1.4";
            readonly bodyLg: "1.75";
            readonly bodyMd: "1.5";
            readonly bodySm: "1.5";
            readonly bodyXs: "1.5";
            readonly label: "1.5";
            readonly button: "1.25";
            readonly caption: "1.5";
            readonly overline: "1.5";
            readonly badge: "1";
        };
        readonly fontWeight: {
            readonly normal: "400";
            readonly medium: "500";
            readonly semibold: "600";
            readonly bold: "700";
            readonly extrabold: "800";
        };
        readonly letterSpacing: {
            readonly display: "-0.02em";
            readonly overline: "0.05em";
        };
    };
};
type GroupiLightTheme = typeof groupiLight;
type SharedTokens = typeof sharedTokens;

/**
 * Groupi Dark Theme
 *
 * All design token values for the dark theme.
 * This is the single source of truth for token values.
 */
declare const groupiDark: {
    readonly brand: {
        readonly primary: "hsl(280, 85%, 60%)";
        readonly primaryHover: "hsl(280, 85%, 68%)";
        readonly primaryActive: "hsl(280, 85%, 52%)";
        readonly primarySubtle: "hsl(280, 40%, 15%)";
        readonly secondary: "hsl(210, 90%, 62%)";
        readonly secondaryHover: "hsl(210, 90%, 70%)";
        readonly accent: "hsl(330, 85%, 62%)";
        readonly accentHover: "hsl(330, 85%, 70%)";
    };
    readonly background: {
        readonly page: "hsl(270, 45%, 7%)";
        readonly surface: "hsl(270, 40%, 11%)";
        readonly elevated: "hsl(270, 35%, 15%)";
        readonly sunken: "hsl(270, 50%, 5%)";
        readonly overlay: "hsla(270, 45%, 4%, 0.85)";
        readonly interactive: "hsl(270, 38%, 13%)";
        readonly interactiveHover: "hsl(270, 35%, 19%)";
        readonly interactiveActive: "hsl(270, 32%, 23%)";
        readonly success: "hsl(145, 70%, 38%)";
        readonly successSubtle: "hsl(145, 40%, 14%)";
        readonly warning: "hsl(38, 92%, 50%)";
        readonly warningSubtle: "hsl(38, 40%, 14%)";
        readonly error: "hsl(0, 65%, 50%)";
        readonly errorSubtle: "hsl(0, 40%, 14%)";
        readonly info: "hsl(210, 90%, 52%)";
        readonly infoSubtle: "hsl(210, 40%, 14%)";
    };
    readonly text: {
        readonly primary: "hsl(270, 20%, 94%)";
        readonly secondary: "hsl(270, 18%, 72%)";
        readonly tertiary: "hsl(270, 15%, 60%)";
        readonly muted: "hsl(270, 15%, 55%)";
        readonly disabled: "hsl(270, 12%, 40%)";
        readonly heading: "hsl(270, 25%, 97%)";
        readonly body: "hsl(270, 20%, 92%)";
        readonly caption: "hsl(270, 18%, 68%)";
        readonly onPrimary: "hsl(0, 0%, 100%)";
        readonly onSurface: "hsl(0, 0%, 95%)";
        readonly onError: "hsl(0, 0%, 100%)";
        readonly link: "hsl(280, 85%, 70%)";
        readonly linkHover: "hsl(280, 85%, 78%)";
        readonly success: "hsl(145, 70%, 58%)";
        readonly warning: "hsl(38, 92%, 62%)";
        readonly error: "hsl(0, 65%, 62%)";
    };
    readonly border: {
        readonly default: "hsl(270, 30%, 20%)";
        readonly strong: "hsl(270, 28%, 28%)";
        readonly subtle: "hsl(270, 35%, 14%)";
        readonly focus: "hsl(280, 85%, 60%)";
        readonly error: "hsl(0, 65%, 50%)";
        readonly success: "hsl(145, 70%, 38%)";
    };
    readonly state: {
        readonly focusRing: "hsl(280, 85%, 60%, 0.5)";
        readonly selection: "hsl(280, 85%, 60%, 0.25)";
        readonly highlight: "hsl(45, 100%, 50%, 0.12)";
    };
    readonly fun: {
        readonly celebration: "hsl(45, 100%, 58%)";
        readonly achievement: "hsl(145, 70%, 52%)";
        readonly streak: "hsl(25, 95%, 58%)";
        readonly party: "hsl(330, 85%, 62%)";
    };
    readonly shadow: {
        readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)";
        readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)";
        readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)";
        readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)";
        readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.4)";
        readonly glow: "0 0 20px 0 hsl(280 85% 60% / 0.35)";
        readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)";
    };
    readonly legacy: {
        readonly background: "hsl(270, 45%, 7%)";
        readonly foreground: "hsl(270, 20%, 94%)";
        readonly muted: "hsl(270, 38%, 13%)";
        readonly mutedForeground: "hsl(270, 15%, 55%)";
        readonly popover: "hsl(270, 35%, 15%)";
        readonly popoverForeground: "hsl(270, 18%, 72%)";
        readonly card: "hsl(270, 40%, 11%)";
        readonly cardForeground: "hsl(270, 20%, 94%)";
        readonly border: "hsl(270, 30%, 20%)";
        readonly input: "hsl(270, 30%, 20%)";
        readonly primary: "hsl(280, 85%, 60%)";
        readonly primaryForeground: "hsl(0, 0%, 100%)";
        readonly secondary: "hsl(270, 38%, 13%)";
        readonly secondaryForeground: "hsl(270, 20%, 94%)";
        readonly accent: "hsl(280, 35%, 18%)";
        readonly accentForeground: "hsl(280, 25%, 95%)";
        readonly destructive: "hsl(0, 65%, 50%)";
        readonly destructiveForeground: "hsl(0, 0%, 98%)";
        readonly ring: "hsl(280, 85%, 60%)";
        readonly radius: "0.5rem";
    };
};
type GroupiDarkTheme = typeof groupiDark;

/**
 * OLED Dark Theme
 *
 * True black backgrounds optimized for OLED screens.
 * Pure blacks (#000) save battery and provide stunning contrast.
 * Vibrant accents pop beautifully against the deep black.
 */

declare const oledDark: ThemeTokens;
type OledDarkTheme = typeof oledDark;

/**
 * Ocean Light Theme
 *
 * A calm, blue-focused light theme inspired by the ocean.
 * Uses cool blues, teals, and aqua tones for a refreshing feel.
 */

declare const oceanLight: ThemeTokens;
type OceanLightTheme = typeof oceanLight;

/**
 * Ocean Dark Theme
 *
 * A calm, blue-focused dark theme inspired by the deep ocean.
 * Uses deep blues with bright cyan/teal accents for a modern feel.
 */

declare const oceanDark: ThemeTokens;
type OceanDarkTheme = typeof oceanDark;

/**
 * Transcend Light Theme
 *
 * A trans pride inspired light theme using the official trans flag colors.
 * Pink: #F5A9B8, Blue: #5BCEFA
 */

declare const transcendLight: ThemeTokens;
type TranscendLightTheme = typeof transcendLight;

/**
 * Transcend Dark Theme
 *
 * A trans pride inspired dark theme using the official trans flag colors.
 * Pink: #F5A9B8, Blue: #5BCEFA
 */

declare const transcendDark: ThemeTokens;
type TranscendDarkTheme = typeof transcendDark;

/**
 * Sunset Light Theme
 *
 * A warm, coral-focused light theme inspired by golden hour sunsets.
 * Uses warm oranges, corals, and soft pinks.
 */

declare const sunsetLight: ThemeTokens;
type SunsetLightTheme = typeof sunsetLight;

/**
 * Sunset Dark Theme
 *
 * A warm, coral-focused dark theme inspired by sunset skies.
 * Uses warm oranges, corals, and soft pinks on deep warm backgrounds.
 */

declare const sunsetDark: ThemeTokens;
type SunsetDarkTheme = typeof sunsetDark;

/**
 * Forest Light Theme
 *
 * An earthy, nature-inspired light theme with forest greens and warm ambers.
 * Evokes peaceful woodland vibes.
 */

declare const forestLight: ThemeTokens;
type ForestLightTheme = typeof forestLight;

/**
 * Forest Dark Theme
 *
 * An earthy, nature-inspired dark theme with forest greens and warm ambers.
 * Deep woodland atmosphere with glowing accents.
 */

declare const forestDark: ThemeTokens;
type ForestDarkTheme = typeof forestDark;

/**
 * Synthwave Dark Theme
 *
 * An 80s retro-inspired dark theme with hot pinks, electric cyans, and neon purples.
 * Nostalgic vibes with vibrant, glowing colors.
 */

declare const synthwaveDark: ThemeTokens;
type SynthwaveDarkTheme = typeof synthwaveDark;

/**
 * Groupi Design Themes
 *
 * Exports all theme definitions, shared tokens, and theme registry.
 * This is the central hub for all theme-related exports.
 */

/**
 * Groupi Light - Default light theme
 * The original purple-focused Groupi identity
 */
declare const groupiLightTheme: BaseTheme;
/**
 * Groupi Dark - Default dark theme
 * The original purple-focused Groupi identity in dark mode
 */
declare const groupiDarkTheme: BaseTheme;
/**
 * OLED Dark - True black theme for OLED screens
 * Pure black backgrounds with vibrant accents
 */
declare const oledDarkTheme: BaseTheme;
/**
 * Ocean Light - Blue-focused light theme
 * A calm, refreshing ocean-inspired theme
 */
declare const oceanLightTheme: BaseTheme;
/**
 * Ocean Dark - Blue-focused dark theme
 * Deep ocean vibes with bright cyan accents
 */
declare const oceanDarkTheme: BaseTheme;
/**
 * Transcend Light - Trans pride inspired light theme
 * Vibrant pinks and blues on soft backgrounds
 */
declare const transcendLightTheme: BaseTheme;
/**
 * Transcend Dark - Trans pride inspired theme
 * Vibrant pinks and blues on deep purple
 */
declare const transcendDarkTheme: BaseTheme;
/**
 * Sunset Light - Warm coral and orange light theme
 * Golden hour warmth
 */
declare const sunsetLightTheme: BaseTheme;
/**
 * Sunset Dark - Warm coral and orange dark theme
 * Cozy sunset vibes
 */
declare const sunsetDarkTheme: BaseTheme;
/**
 * Forest Light - Earthy green light theme
 * Nature-inspired tranquility
 */
declare const forestLightTheme: BaseTheme;
/**
 * Forest Dark - Earthy green dark theme
 * Deep woodland atmosphere
 */
declare const forestDarkTheme: BaseTheme;
/**
 * Synthwave Dark - 80s retro neon theme
 * Hot pinks, electric cyans, nostalgic vibes
 */
declare const synthwaveDarkTheme: BaseTheme;
/**
 * All available base themes indexed by ID
 */
declare const baseThemeRegistry: ThemeRegistry;
/**
 * All base themes as an array (useful for iteration)
 */
declare const baseThemes: BaseTheme[];
/**
 * Light themes only
 */
declare const lightThemes: BaseTheme[];
/**
 * Dark themes only
 */
declare const darkThemes: BaseTheme[];
/**
 * Default theme IDs
 */
declare const DEFAULT_LIGHT_THEME_ID = "groupi-light";
declare const DEFAULT_DARK_THEME_ID = "groupi-dark";
/**
 * Get a base theme by ID
 */
declare function getBaseTheme(id: string): BaseTheme | undefined;
/**
 * Get the paired theme (light → dark, dark → light)
 * For themes in the same family (e.g., groupi-light → groupi-dark)
 */
declare function getPairedTheme(id: string): BaseTheme | undefined;
/**
 * @deprecated Use baseThemeRegistry instead
 */
declare const themes: {
    readonly light: {
        readonly brand: {
            readonly primary: "hsl(285, 100%, 34%)";
            readonly primaryHover: "hsl(285, 100%, 28%)";
            readonly primaryActive: "hsl(285, 100%, 24%)";
            readonly primarySubtle: "hsl(285, 100%, 94%)";
            readonly secondary: "hsl(210, 100%, 50%)";
            readonly secondaryHover: "hsl(210, 100%, 42%)";
            readonly accent: "hsl(330, 100%, 60%)";
            readonly accentHover: "hsl(330, 100%, 50%)";
        };
        readonly background: {
            readonly page: "hsl(0, 0%, 100%)";
            readonly surface: "hsl(0, 0%, 100%)";
            readonly elevated: "hsl(0, 0%, 100%)";
            readonly sunken: "hsl(220, 14%, 96%)";
            readonly overlay: "hsl(0, 0%, 0%, 0.5)";
            readonly interactive: "hsl(220, 14%, 96%)";
            readonly interactiveHover: "hsl(220, 13%, 91%)";
            readonly interactiveActive: "hsl(218, 12%, 83%)";
            readonly success: "hsl(145, 80%, 45%)";
            readonly successSubtle: "hsl(145, 80%, 90%)";
            readonly warning: "hsl(35, 100%, 55%)";
            readonly warningSubtle: "hsl(35, 100%, 90%)";
            readonly error: "hsl(0, 85%, 55%)";
            readonly errorSubtle: "hsl(0, 85%, 93%)";
            readonly info: "hsl(210, 100%, 50%)";
            readonly infoSubtle: "hsl(210, 100%, 94%)";
        };
        readonly text: {
            readonly primary: "hsl(222.2, 47.4%, 11.2%)";
            readonly secondary: "hsl(217, 9%, 40%)";
            readonly tertiary: "hsl(217, 10%, 50%)";
            readonly muted: "hsl(215.4, 16.3%, 46.9%)";
            readonly disabled: "hsl(217, 10%, 65%)";
            readonly heading: "hsl(222.2, 47.4%, 11.2%)";
            readonly body: "hsl(222.2, 47.4%, 11.2%)";
            readonly caption: "hsl(217, 9%, 40%)";
            readonly onPrimary: "hsl(0, 0%, 100%)";
            readonly onSurface: "hsl(222.2, 47.4%, 11.2%)";
            readonly onError: "hsl(0, 0%, 100%)";
            readonly link: "hsl(285, 100%, 34%)";
            readonly linkHover: "hsl(285, 100%, 28%)";
            readonly success: "hsl(145, 80%, 28%)";
            readonly warning: "hsl(35, 100%, 36%)";
            readonly error: "hsl(0, 85%, 46%)";
        };
        readonly border: {
            readonly default: "hsl(214.3, 31.8%, 91.4%)";
            readonly strong: "hsl(218, 12%, 83%)";
            readonly subtle: "hsl(220, 13%, 95%)";
            readonly focus: "hsl(285, 100%, 34%)";
            readonly error: "hsl(0, 85%, 55%)";
            readonly success: "hsl(145, 80%, 45%)";
        };
        readonly state: {
            readonly focusRing: "hsl(285, 100%, 34%, 0.4)";
            readonly selection: "hsl(285, 100%, 34%, 0.15)";
            readonly highlight: "hsl(45, 100%, 50%, 0.2)";
        };
        readonly fun: {
            readonly celebration: "hsl(45, 100%, 50%)";
            readonly achievement: "hsl(145, 80%, 45%)";
            readonly streak: "hsl(25, 100%, 55%)";
            readonly party: "hsl(330, 100%, 60%)";
        };
        readonly shadow: {
            readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
            readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
            readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
            readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
            readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.1)";
            readonly glow: "0 0 20px 0 hsl(285 100% 34% / 0.3)";
            readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.1)";
        };
        readonly legacy: {
            readonly background: "hsl(0, 0%, 100%)";
            readonly foreground: "hsl(222.2, 47.4%, 11.2%)";
            readonly muted: "hsl(210, 40%, 96.1%)";
            readonly mutedForeground: "hsl(215.4, 16.3%, 46.9%)";
            readonly popover: "hsl(0, 0%, 100%)";
            readonly popoverForeground: "hsl(222.2, 47.4%, 11.2%)";
            readonly card: "hsl(0, 0%, 100%)";
            readonly cardForeground: "hsl(222.2, 47.4%, 11.2%)";
            readonly border: "hsl(214.3, 31.8%, 91.4%)";
            readonly input: "hsl(214.3, 31.8%, 91.4%)";
            readonly primary: "hsl(285, 100%, 34%)";
            readonly primaryForeground: "hsl(210, 40%, 98%)";
            readonly secondary: "hsl(210, 40%, 96.1%)";
            readonly secondaryForeground: "hsl(222.2, 47.4%, 11.2%)";
            readonly accent: "hsl(260, 40%, 96.1%)";
            readonly accentForeground: "hsl(273.2, 47.4%, 11.2%)";
            readonly destructive: "hsl(0, 85%, 55%)";
            readonly destructiveForeground: "hsl(210, 40%, 98%)";
            readonly ring: "hsl(215, 20.2%, 65.1%)";
            readonly radius: "0.5rem";
        };
    };
    readonly dark: {
        readonly brand: {
            readonly primary: "hsl(280, 85%, 60%)";
            readonly primaryHover: "hsl(280, 85%, 68%)";
            readonly primaryActive: "hsl(280, 85%, 52%)";
            readonly primarySubtle: "hsl(280, 40%, 15%)";
            readonly secondary: "hsl(210, 90%, 62%)";
            readonly secondaryHover: "hsl(210, 90%, 70%)";
            readonly accent: "hsl(330, 85%, 62%)";
            readonly accentHover: "hsl(330, 85%, 70%)";
        };
        readonly background: {
            readonly page: "hsl(270, 45%, 7%)";
            readonly surface: "hsl(270, 40%, 11%)";
            readonly elevated: "hsl(270, 35%, 15%)";
            readonly sunken: "hsl(270, 50%, 5%)";
            readonly overlay: "hsla(270, 45%, 4%, 0.85)";
            readonly interactive: "hsl(270, 38%, 13%)";
            readonly interactiveHover: "hsl(270, 35%, 19%)";
            readonly interactiveActive: "hsl(270, 32%, 23%)";
            readonly success: "hsl(145, 70%, 38%)";
            readonly successSubtle: "hsl(145, 40%, 14%)";
            readonly warning: "hsl(38, 92%, 50%)";
            readonly warningSubtle: "hsl(38, 40%, 14%)";
            readonly error: "hsl(0, 65%, 50%)";
            readonly errorSubtle: "hsl(0, 40%, 14%)";
            readonly info: "hsl(210, 90%, 52%)";
            readonly infoSubtle: "hsl(210, 40%, 14%)";
        };
        readonly text: {
            readonly primary: "hsl(270, 20%, 94%)";
            readonly secondary: "hsl(270, 18%, 72%)";
            readonly tertiary: "hsl(270, 15%, 60%)";
            readonly muted: "hsl(270, 15%, 55%)";
            readonly disabled: "hsl(270, 12%, 40%)";
            readonly heading: "hsl(270, 25%, 97%)";
            readonly body: "hsl(270, 20%, 92%)";
            readonly caption: "hsl(270, 18%, 68%)";
            readonly onPrimary: "hsl(0, 0%, 100%)";
            readonly onSurface: "hsl(0, 0%, 95%)";
            readonly onError: "hsl(0, 0%, 100%)";
            readonly link: "hsl(280, 85%, 70%)";
            readonly linkHover: "hsl(280, 85%, 78%)";
            readonly success: "hsl(145, 70%, 58%)";
            readonly warning: "hsl(38, 92%, 62%)";
            readonly error: "hsl(0, 65%, 62%)";
        };
        readonly border: {
            readonly default: "hsl(270, 30%, 20%)";
            readonly strong: "hsl(270, 28%, 28%)";
            readonly subtle: "hsl(270, 35%, 14%)";
            readonly focus: "hsl(280, 85%, 60%)";
            readonly error: "hsl(0, 65%, 50%)";
            readonly success: "hsl(145, 70%, 38%)";
        };
        readonly state: {
            readonly focusRing: "hsl(280, 85%, 60%, 0.5)";
            readonly selection: "hsl(280, 85%, 60%, 0.25)";
            readonly highlight: "hsl(45, 100%, 50%, 0.12)";
        };
        readonly fun: {
            readonly celebration: "hsl(45, 100%, 58%)";
            readonly achievement: "hsl(145, 70%, 52%)";
            readonly streak: "hsl(25, 95%, 58%)";
            readonly party: "hsl(330, 85%, 62%)";
        };
        readonly shadow: {
            readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)";
            readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)";
            readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)";
            readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)";
            readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.4)";
            readonly glow: "0 0 20px 0 hsl(280 85% 60% / 0.35)";
            readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.4)";
        };
        readonly legacy: {
            readonly background: "hsl(270, 45%, 7%)";
            readonly foreground: "hsl(270, 20%, 94%)";
            readonly muted: "hsl(270, 38%, 13%)";
            readonly mutedForeground: "hsl(270, 15%, 55%)";
            readonly popover: "hsl(270, 35%, 15%)";
            readonly popoverForeground: "hsl(270, 18%, 72%)";
            readonly card: "hsl(270, 40%, 11%)";
            readonly cardForeground: "hsl(270, 20%, 94%)";
            readonly border: "hsl(270, 30%, 20%)";
            readonly input: "hsl(270, 30%, 20%)";
            readonly primary: "hsl(280, 85%, 60%)";
            readonly primaryForeground: "hsl(0, 0%, 100%)";
            readonly secondary: "hsl(270, 38%, 13%)";
            readonly secondaryForeground: "hsl(270, 20%, 94%)";
            readonly accent: "hsl(280, 35%, 18%)";
            readonly accentForeground: "hsl(280, 25%, 95%)";
            readonly destructive: "hsl(0, 65%, 50%)";
            readonly destructiveForeground: "hsl(0, 0%, 98%)";
            readonly ring: "hsl(280, 85%, 60%)";
            readonly radius: "0.5rem";
        };
    };
};
/**
 * Shared tokens (spacing, radius, duration, etc.)
 * These are the same across all themes
 */
declare const tokens: {
    readonly spacing: {
        readonly inset: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
            readonly xl: "2rem";
            readonly '2xl': "3rem";
        };
        readonly stack: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
            readonly xl: "2rem";
            readonly section: "3rem";
        };
        readonly inline: {
            readonly xs: "0.25rem";
            readonly sm: "0.5rem";
            readonly md: "1rem";
            readonly lg: "1.5rem";
        };
        readonly layout: {
            readonly pageMargin: "1rem";
            readonly sectionGap: "3rem";
            readonly containerPadding: "2rem";
        };
    };
    readonly radius: {
        readonly shape: {
            readonly subtle: "0.5rem";
            readonly soft: "1rem";
            readonly rounded: "1.25rem";
            readonly pill: "9999px";
        };
        readonly component: {
            readonly button: "1rem";
            readonly card: "1.25rem";
            readonly input: "0.75rem";
            readonly badge: "9999px";
            readonly avatar: "50%";
            readonly modal: "1.5rem";
            readonly tooltip: "0.75rem";
            readonly dropdown: "1rem";
            readonly sheet: "1.5rem";
        };
    };
    readonly duration: {
        readonly instant: "0ms";
        readonly micro: "100ms";
        readonly fast: "150ms";
        readonly normal: "200ms";
        readonly slow: "300ms";
        readonly slower: "500ms";
    };
    readonly easing: {
        readonly default: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly enter: "cubic-bezier(0, 0, 0.2, 1)";
        readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
        readonly bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)";
        readonly spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    };
    readonly zIndex: {
        readonly lifted: 1;
        readonly float: 2;
        readonly top: 3;
        readonly base: 0;
        readonly sticky: 40;
        readonly popover: 50;
        readonly dropdown: 60;
        readonly modal: 70;
        readonly toast: 80;
        readonly tooltip: 90;
        readonly overlay: 100;
    };
    readonly typography: {
        readonly fontFamily: {
            readonly sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif";
            readonly mono: "\"Fira Code\", ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace";
        };
        readonly fontSize: {
            readonly display: "3rem";
            readonly h1: "2.25rem";
            readonly h2: "1.875rem";
            readonly h3: "1.5rem";
            readonly h4: "1.25rem";
            readonly bodyLg: "1.125rem";
            readonly bodyMd: "1rem";
            readonly bodySm: "0.875rem";
            readonly bodyXs: "0.75rem";
            readonly label: "0.875rem";
            readonly button: "0.875rem";
            readonly caption: "0.75rem";
            readonly overline: "0.75rem";
            readonly badge: "0.75rem";
        };
        readonly lineHeight: {
            readonly display: "1.1";
            readonly h1: "1.2";
            readonly h2: "1.3";
            readonly h3: "1.4";
            readonly h4: "1.4";
            readonly bodyLg: "1.75";
            readonly bodyMd: "1.5";
            readonly bodySm: "1.5";
            readonly bodyXs: "1.5";
            readonly label: "1.5";
            readonly button: "1.25";
            readonly caption: "1.5";
            readonly overline: "1.5";
            readonly badge: "1";
        };
        readonly fontWeight: {
            readonly normal: "400";
            readonly medium: "500";
            readonly semibold: "600";
            readonly bold: "700";
            readonly extrabold: "800";
        };
        readonly letterSpacing: {
            readonly display: "-0.02em";
            readonly overline: "0.05em";
        };
    };
};
/**
 * @deprecated Use ThemeTokens type instead
 */
type Theme = typeof groupiLight | typeof groupiDark;

export { type BackgroundTokens, type BaseTheme, type BorderTokens, type BrandTokens, type CustomTheme, DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, type EditableBackgroundTokens, type EditableBrandTokens, type EditableShadowTokens, type EditableStatusTokens, type EditableTextTokens, type EditableTokenCategory, type EditableTokenCategoryDef, type EditableTokenDef, type ForestDarkTheme, type ForestLightTheme, type FunTokens, type GroupiDarkTheme, type GroupiLightTheme, type LegacyTokens, type OceanDarkTheme, type OceanLightTheme, type OledDarkTheme, type ShadowTokens, type SharedTokens, type StateTokens, type SunsetDarkTheme, type SunsetLightTheme, type SynthwaveDarkTheme, type TextTokens, type Theme, type ThemeEditorState, type ThemeMode, type ThemePreferences, type ThemePreview, type ThemeRegistry, type ThemeSelectionType, type ThemeTokenOverrides, type ThemeTokens, type TranscendDarkTheme, type TranscendLightTheme, baseThemeRegistry, baseThemes, darkThemes, forestDark, forestDarkTheme, forestLight, forestLightTheme, getBaseTheme, getPairedTheme, groupiDark, groupiDarkTheme, groupiLight, groupiLightTheme, lightThemes, oceanDark, oceanDarkTheme, oceanLight, oceanLightTheme, oledDark, oledDarkTheme, sharedTokens, sunsetDark, sunsetDarkTheme, sunsetLight, sunsetLightTheme, synthwaveDark, synthwaveDarkTheme, themes, tokens, transcendDark, transcendDarkTheme, transcendLight, transcendLightTheme };
