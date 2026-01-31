'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps as NextThemesProviderProps,
} from 'next-themes';
import {
  baseThemeRegistry,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
  type BaseTheme,
} from '@groupi/shared/design/themes';

// ==========================================================================
// TYPES
// ==========================================================================

export interface ThemeContextValue {
  /** Currently active theme ID (base or custom) */
  currentThemeId: string;
  /** Whether current theme is a custom theme */
  isCustomTheme: boolean;
  /** Get a base theme by ID */
  getBaseTheme: (id: string) => BaseTheme | undefined;
  /** All available base themes */
  baseThemes: BaseTheme[];
  /** Light base themes */
  lightThemes: BaseTheme[];
  /** Dark base themes */
  darkThemes: BaseTheme[];
  /** Set theme by ID (handles both base and custom) */
  setThemeById: (themeId: string, isCustom?: boolean) => void;
  /** Apply custom theme CSS overrides */
  applyCustomThemeCSS: (css: string) => void;
  /** Clear custom theme CSS */
  clearCustomThemeCSS: () => void;
  /** Current theme mode (light/dark) based on resolved theme */
  resolvedMode: 'light' | 'dark' | undefined;
}

// ==========================================================================
// CONTEXT
// ==========================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useGroupiTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGroupiTheme must be used within a ThemeProvider');
  }
  return context;
}

// ==========================================================================
// INNER PROVIDER (has access to next-themes)
// ==========================================================================

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [customThemeStyleId] = useState('custom-theme-overrides');
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  // Parse the current theme to extract theme ID
  // Format: "theme-{themeId}" for multi-theme, "light"/"dark"/"system" for legacy
  const currentThemeId = useMemo(() => {
    if (!theme) return DEFAULT_LIGHT_THEME_ID;

    // Handle legacy theme values
    if (theme === 'light') return DEFAULT_LIGHT_THEME_ID;
    if (theme === 'dark') return DEFAULT_DARK_THEME_ID;
    if (theme === 'system') {
      // Use resolved theme for system
      if (resolvedTheme === 'dark') return DEFAULT_DARK_THEME_ID;
      return DEFAULT_LIGHT_THEME_ID;
    }

    // Handle new theme class format (theme-groupi-light, etc.)
    if (theme.startsWith('theme-')) {
      return theme.replace('theme-', '');
    }

    return DEFAULT_LIGHT_THEME_ID;
  }, [theme, resolvedTheme]);

  // Derive resolved mode from the current theme
  const resolvedMode = useMemo(() => {
    const baseTheme = baseThemeRegistry[currentThemeId];
    if (baseTheme) {
      return baseTheme.mode;
    }
    // Fallback to resolved theme from next-themes
    if (resolvedTheme === 'dark') return 'dark';
    if (resolvedTheme === 'light') return 'light';
    return undefined;
  }, [currentThemeId, resolvedTheme]);

  // Get base themes organized by mode
  const baseThemes = useMemo(() => Object.values(baseThemeRegistry), []);
  const lightThemes = useMemo(
    () => baseThemes.filter(t => t.mode === 'light'),
    [baseThemes]
  );
  const darkThemes = useMemo(
    () => baseThemes.filter(t => t.mode === 'dark'),
    [baseThemes]
  );

  // Get a base theme by ID
  const getBaseTheme = (id: string): BaseTheme | undefined => {
    return baseThemeRegistry[id];
  };

  // Set theme by ID
  const setThemeById = (themeId: string, isCustom = false) => {
    setIsCustomTheme(isCustom);

    if (isCustom) {
      // For custom themes, we apply the base theme class and overlay custom CSS
      // The themeId here is the custom theme ID - we set it directly
      // and the ThemeSync component will handle applying the base theme + overrides
      setTheme(`theme-${themeId}`);
    } else {
      // For base themes, use the theme class directly
      setTheme(`theme-${themeId}`);
    }
  };

  // Apply custom theme CSS overrides
  const applyCustomThemeCSS = (css: string) => {
    // Remove existing custom style element if present
    const existing = document.getElementById(customThemeStyleId);
    if (existing) {
      existing.remove();
    }

    // Create and inject new style element
    const style = document.createElement('style');
    style.id = customThemeStyleId;
    style.textContent = css;
    document.head.appendChild(style);
  };

  // Clear custom theme CSS
  const clearCustomThemeCSS = () => {
    const existing = document.getElementById(customThemeStyleId);
    if (existing) {
      existing.remove();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCustomThemeCSS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ThemeContextValue = {
    currentThemeId,
    isCustomTheme,
    getBaseTheme,
    baseThemes,
    lightThemes,
    darkThemes,
    setThemeById,
    applyCustomThemeCSS,
    clearCustomThemeCSS,
    resolvedMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ==========================================================================
// MAIN PROVIDER
// ==========================================================================

interface ThemeProviderProps extends NextThemesProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Generate the list of all available themes for next-themes
  const themes = useMemo(() => {
    const baseThemeClasses = Object.keys(baseThemeRegistry).map(
      id => `theme-${id}`
    );
    // Include legacy theme names for backwards compatibility
    return ['light', 'dark', 'system', ...baseThemeClasses];
  }, []);

  return (
    <NextThemesProvider
      {...props}
      themes={themes}
      attribute='class'
      defaultTheme='system'
      enableSystem
      // Map system preference to the correct theme class
      value={{
        light: `theme-${DEFAULT_LIGHT_THEME_ID}`,
        dark: `theme-${DEFAULT_DARK_THEME_ID}`,
        system: 'system',
        ...Object.fromEntries(
          Object.keys(baseThemeRegistry).map(id => [
            `theme-${id}`,
            `theme-${id}`,
          ])
        ),
      }}
    >
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
}
