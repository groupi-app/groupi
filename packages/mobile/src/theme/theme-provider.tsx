import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import {
  type ThemeTokens,
  baseThemeRegistry,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
} from '@groupi/shared/design/themes';

interface ThemeContextValue {
  themeId: string;
  tokens: ThemeTokens;
  isDark: boolean;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Convert ThemeTokens to CSS variable overrides for Uniwind.
 */
function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    '--color-primary': tokens.brand.primary,
    '--color-primary-hover': tokens.brand.primaryHover,
    '--color-primary-foreground': tokens.text.onPrimary ?? 'hsl(0, 0%, 100%)',
    '--color-secondary': tokens.brand.secondary,
    '--color-secondary-foreground':
      tokens.text.secondary ?? tokens.text.primary,
    '--color-accent': tokens.brand.accent,
    '--color-accent-foreground': tokens.text.primary,
    '--color-background': tokens.background.page,
    '--color-foreground': tokens.text.primary,
    '--color-card': tokens.background.surface,
    '--color-card-foreground': tokens.text.primary,
    '--color-popover': tokens.background.elevated,
    '--color-popover-foreground': tokens.text.primary,
    '--color-muted': tokens.background.interactive,
    '--color-muted-foreground': tokens.text.muted ?? tokens.text.secondary,
    '--color-bg-surface': tokens.background.surface,
    '--color-bg-elevated': tokens.background.elevated,
    '--color-bg-sunken': tokens.background.sunken,
    '--color-bg-interactive': tokens.background.interactive,
    '--color-bg-overlay': tokens.background.overlay,
    '--color-success': tokens.background.success,
    '--color-bg-success-subtle': tokens.background.successSubtle,
    '--color-warning': tokens.background.warning,
    '--color-bg-warning-subtle': tokens.background.warningSubtle,
    '--color-error': tokens.background.error,
    '--color-bg-error-subtle': tokens.background.errorSubtle,
    '--color-info': tokens.background.info,
    '--color-bg-info-subtle': tokens.background.infoSubtle,
    '--color-destructive': tokens.background.error,
    '--color-destructive-foreground':
      tokens.text.onPrimary ?? 'hsl(0, 0%, 100%)',
    '--color-text-secondary': tokens.text.secondary,
    '--color-text-tertiary': tokens.text.tertiary,
    '--color-border': tokens.border.default,
    '--color-border-strong': tokens.border.strong,
    '--color-border-subtle': tokens.border.subtle,
    '--color-border-focus': tokens.border.focus ?? tokens.brand.primary,
    '--color-border-error': tokens.border.error ?? tokens.background.error,
    '--color-border-success':
      tokens.border.success ?? tokens.background.success,
    '--color-input': tokens.border.default,
    '--color-ring': tokens.border.focus ?? tokens.brand.primary,
  };
}

/**
 * Apply a theme by setting Uniwind's mode and injecting its CSS variables.
 */
function applyTheme(themeEntry: (typeof baseThemeRegistry)[string]) {
  const mode = themeEntry.mode === 'dark' ? 'dark' : 'light';
  // Set mode first, then override variables for that mode
  Uniwind.setTheme(mode);
  Uniwind.updateCSSVariables(mode, tokensToCssVars(themeEntry.tokens));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const defaultThemeId =
    systemColorScheme === 'dark'
      ? DEFAULT_DARK_THEME_ID
      : DEFAULT_LIGHT_THEME_ID;

  const [themeId, setThemeId] = useState(defaultThemeId);

  const theme = baseThemeRegistry[themeId];
  const tokens =
    theme?.tokens ?? baseThemeRegistry[DEFAULT_LIGHT_THEME_ID].tokens;
  const isDark = theme?.mode === 'dark';

  const setTheme = useCallback(
    (id: string) => {
      const themeEntry = baseThemeRegistry[id];
      if (!themeEntry) return;

      setThemeId(id);
      applyTheme(themeEntry);
    },
    [],
  );

  return (
    <ThemeContext.Provider value={{ themeId, tokens, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
