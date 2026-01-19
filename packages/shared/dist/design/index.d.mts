import { ClassValue } from 'clsx';

/**
 * Design Tokens
 * Shared across web and mobile platforms
 */
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
declare const spacing: {
    readonly 0: "0";
    readonly 1: "0.25rem";
    readonly 2: "0.5rem";
    readonly 3: "0.75rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 8: "2rem";
    readonly 10: "2.5rem";
    readonly 12: "3rem";
    readonly 16: "4rem";
    readonly 20: "5rem";
    readonly 24: "6rem";
};
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
    };
};
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
declare const shadows: {
    readonly sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    readonly DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
    readonly md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
    readonly lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    readonly xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
};
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
declare const breakpoints: {
    readonly sm: "640px";
    readonly md: "768px";
    readonly lg: "1024px";
    readonly xl: "1280px";
    readonly '2xl': "1536px";
};

declare function cn(...inputs: ClassValue[]): string;

export { animations, borderRadius, breakpoints, cn, colors, shadows, spacing, typography };
