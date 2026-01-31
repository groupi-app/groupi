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
        readonly primary: "hsl(285, 100%, 50%)";
        readonly primaryHover: "hsl(285, 100%, 58%)";
        readonly primaryActive: "hsl(285, 100%, 45%)";
        readonly primarySubtle: "hsl(285, 60%, 15%)";
        readonly secondary: "hsl(210, 100%, 60%)";
        readonly secondaryHover: "hsl(210, 100%, 68%)";
        readonly accent: "hsl(330, 100%, 65%)";
        readonly accentHover: "hsl(330, 100%, 72%)";
    };
    readonly background: {
        readonly page: "hsl(264, 71%, 6%)";
        readonly surface: "hsl(264, 50%, 10%)";
        readonly elevated: "hsl(264, 40%, 14%)";
        readonly sunken: "hsl(264, 80%, 4%)";
        readonly overlay: "hsl(0, 0%, 0%, 0.7)";
        readonly interactive: "hsl(264, 40%, 14%)";
        readonly interactiveHover: "hsl(264, 35%, 20%)";
        readonly interactiveActive: "hsl(264, 30%, 25%)";
        readonly success: "hsl(145, 80%, 35%)";
        readonly successSubtle: "hsl(145, 50%, 12%)";
        readonly warning: "hsl(35, 100%, 45%)";
        readonly warningSubtle: "hsl(35, 50%, 12%)";
        readonly error: "hsl(0, 70%, 45%)";
        readonly errorSubtle: "hsl(0, 50%, 12%)";
        readonly info: "hsl(210, 100%, 45%)";
        readonly infoSubtle: "hsl(210, 50%, 12%)";
    };
    readonly text: {
        readonly primary: "hsl(213, 31%, 91%)";
        readonly secondary: "hsl(215, 20%, 65%)";
        readonly tertiary: "hsl(215, 16%, 55%)";
        readonly muted: "hsl(215.4, 16.3%, 56.9%)";
        readonly disabled: "hsl(215, 14%, 40%)";
        readonly heading: "hsl(213, 31%, 95%)";
        readonly body: "hsl(213, 31%, 91%)";
        readonly caption: "hsl(215, 20%, 65%)";
        readonly onPrimary: "hsl(0, 0%, 100%)";
        readonly onSurface: "hsl(213, 31%, 91%)";
        readonly onError: "hsl(0, 0%, 100%)";
        readonly link: "hsl(285, 100%, 70%)";
        readonly linkHover: "hsl(285, 100%, 80%)";
        readonly success: "hsl(145, 80%, 55%)";
        readonly warning: "hsl(35, 100%, 60%)";
        readonly error: "hsl(0, 70%, 60%)";
    };
    readonly border: {
        readonly default: "hsl(216, 34%, 17%)";
        readonly strong: "hsl(216, 30%, 25%)";
        readonly subtle: "hsl(216, 40%, 12%)";
        readonly focus: "hsl(285, 100%, 50%)";
        readonly error: "hsl(0, 70%, 45%)";
        readonly success: "hsl(145, 80%, 35%)";
    };
    readonly state: {
        readonly focusRing: "hsl(285, 100%, 50%, 0.5)";
        readonly selection: "hsl(285, 100%, 50%, 0.2)";
        readonly highlight: "hsl(45, 100%, 50%, 0.15)";
    };
    readonly fun: {
        readonly celebration: "hsl(45, 100%, 55%)";
        readonly achievement: "hsl(145, 80%, 50%)";
        readonly streak: "hsl(25, 100%, 60%)";
        readonly party: "hsl(330, 100%, 65%)";
    };
    readonly shadow: {
        readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)";
        readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)";
        readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)";
        readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)";
        readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.3)";
        readonly glow: "0 0 20px 0 hsl(285 100% 50% / 0.4)";
        readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.3)";
    };
    readonly legacy: {
        readonly background: "hsl(264, 71%, 6%)";
        readonly foreground: "hsl(213, 31%, 91%)";
        readonly muted: "hsl(223, 47%, 11%)";
        readonly mutedForeground: "hsl(215.4, 16.3%, 56.9%)";
        readonly popover: "hsl(264, 71%, 6%)";
        readonly popoverForeground: "hsl(215, 20.2%, 65.1%)";
        readonly card: "hsl(264, 71%, 6%)";
        readonly cardForeground: "hsl(213, 31%, 91%)";
        readonly border: "hsl(216, 34%, 17%)";
        readonly input: "hsl(216, 34%, 17%)";
        readonly primary: "hsl(285, 100%, 50%)";
        readonly primaryForeground: "hsl(0, 0%, 100%)";
        readonly secondary: "hsl(222.2, 47.4%, 11.2%)";
        readonly secondaryForeground: "hsl(210, 40%, 98%)";
        readonly accent: "hsl(273, 34%, 16%)";
        readonly accentForeground: "hsl(260, 40%, 98%)";
        readonly destructive: "hsl(0, 63%, 45%)";
        readonly destructiveForeground: "hsl(210, 40%, 98%)";
        readonly ring: "hsl(285, 100%, 50%)";
        readonly radius: "0.5rem";
    };
};
type GroupiDarkTheme = typeof groupiDark;

/**
 * Groupi Design Themes
 *
 * Exports all theme definitions and shared tokens.
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
            readonly primary: "hsl(285, 100%, 50%)";
            readonly primaryHover: "hsl(285, 100%, 58%)";
            readonly primaryActive: "hsl(285, 100%, 45%)";
            readonly primarySubtle: "hsl(285, 60%, 15%)";
            readonly secondary: "hsl(210, 100%, 60%)";
            readonly secondaryHover: "hsl(210, 100%, 68%)";
            readonly accent: "hsl(330, 100%, 65%)";
            readonly accentHover: "hsl(330, 100%, 72%)";
        };
        readonly background: {
            readonly page: "hsl(264, 71%, 6%)";
            readonly surface: "hsl(264, 50%, 10%)";
            readonly elevated: "hsl(264, 40%, 14%)";
            readonly sunken: "hsl(264, 80%, 4%)";
            readonly overlay: "hsl(0, 0%, 0%, 0.7)";
            readonly interactive: "hsl(264, 40%, 14%)";
            readonly interactiveHover: "hsl(264, 35%, 20%)";
            readonly interactiveActive: "hsl(264, 30%, 25%)";
            readonly success: "hsl(145, 80%, 35%)";
            readonly successSubtle: "hsl(145, 50%, 12%)";
            readonly warning: "hsl(35, 100%, 45%)";
            readonly warningSubtle: "hsl(35, 50%, 12%)";
            readonly error: "hsl(0, 70%, 45%)";
            readonly errorSubtle: "hsl(0, 50%, 12%)";
            readonly info: "hsl(210, 100%, 45%)";
            readonly infoSubtle: "hsl(210, 50%, 12%)";
        };
        readonly text: {
            readonly primary: "hsl(213, 31%, 91%)";
            readonly secondary: "hsl(215, 20%, 65%)";
            readonly tertiary: "hsl(215, 16%, 55%)";
            readonly muted: "hsl(215.4, 16.3%, 56.9%)";
            readonly disabled: "hsl(215, 14%, 40%)";
            readonly heading: "hsl(213, 31%, 95%)";
            readonly body: "hsl(213, 31%, 91%)";
            readonly caption: "hsl(215, 20%, 65%)";
            readonly onPrimary: "hsl(0, 0%, 100%)";
            readonly onSurface: "hsl(213, 31%, 91%)";
            readonly onError: "hsl(0, 0%, 100%)";
            readonly link: "hsl(285, 100%, 70%)";
            readonly linkHover: "hsl(285, 100%, 80%)";
            readonly success: "hsl(145, 80%, 55%)";
            readonly warning: "hsl(35, 100%, 60%)";
            readonly error: "hsl(0, 70%, 60%)";
        };
        readonly border: {
            readonly default: "hsl(216, 34%, 17%)";
            readonly strong: "hsl(216, 30%, 25%)";
            readonly subtle: "hsl(216, 40%, 12%)";
            readonly focus: "hsl(285, 100%, 50%)";
            readonly error: "hsl(0, 70%, 45%)";
            readonly success: "hsl(145, 80%, 35%)";
        };
        readonly state: {
            readonly focusRing: "hsl(285, 100%, 50%, 0.5)";
            readonly selection: "hsl(285, 100%, 50%, 0.2)";
            readonly highlight: "hsl(45, 100%, 50%, 0.15)";
        };
        readonly fun: {
            readonly celebration: "hsl(45, 100%, 55%)";
            readonly achievement: "hsl(145, 80%, 50%)";
            readonly streak: "hsl(25, 100%, 60%)";
            readonly party: "hsl(330, 100%, 65%)";
        };
        readonly shadow: {
            readonly raised: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)";
            readonly floating: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)";
            readonly overlay: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)";
            readonly popup: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)";
            readonly pop: "0 4px 0 0 rgb(0 0 0 / 0.3)";
            readonly glow: "0 0 20px 0 hsl(285 100% 50% / 0.4)";
            readonly bounce: "0 2px 0 0 rgb(0 0 0 / 0.3)";
        };
        readonly legacy: {
            readonly background: "hsl(264, 71%, 6%)";
            readonly foreground: "hsl(213, 31%, 91%)";
            readonly muted: "hsl(223, 47%, 11%)";
            readonly mutedForeground: "hsl(215.4, 16.3%, 56.9%)";
            readonly popover: "hsl(264, 71%, 6%)";
            readonly popoverForeground: "hsl(215, 20.2%, 65.1%)";
            readonly card: "hsl(264, 71%, 6%)";
            readonly cardForeground: "hsl(213, 31%, 91%)";
            readonly border: "hsl(216, 34%, 17%)";
            readonly input: "hsl(216, 34%, 17%)";
            readonly primary: "hsl(285, 100%, 50%)";
            readonly primaryForeground: "hsl(0, 0%, 100%)";
            readonly secondary: "hsl(222.2, 47.4%, 11.2%)";
            readonly secondaryForeground: "hsl(210, 40%, 98%)";
            readonly accent: "hsl(273, 34%, 16%)";
            readonly accentForeground: "hsl(260, 40%, 98%)";
            readonly destructive: "hsl(0, 63%, 45%)";
            readonly destructiveForeground: "hsl(210, 40%, 98%)";
            readonly ring: "hsl(285, 100%, 50%)";
            readonly radius: "0.5rem";
        };
    };
};
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
type Theme = typeof groupiLight | typeof groupiDark;

export { type GroupiDarkTheme, type GroupiLightTheme, type SharedTokens, type Theme, groupiDark, groupiLight, sharedTokens, themes, tokens };
