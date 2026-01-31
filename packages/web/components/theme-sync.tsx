'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useGroupiTheme } from '@/providers/theme-provider';
import { useGlobalUser } from '@/context/global-user-context';
import type { ThemeTokenOverrides } from '@groupi/shared/design/themes';

// Types for theme queries to avoid deep type instantiation
type ThemePreferences = Doc<'themePreferences'> | null | undefined;
type CustomTheme = Doc<'customThemes'>;
type CustomThemes = CustomTheme[] | undefined;

// localStorage key for persisting custom theme CSS
const CUSTOM_THEME_CSS_KEY = 'groupi-custom-theme-css';

/**
 * Save custom theme CSS to localStorage for instant loading
 */
function saveCustomThemeCSSToStorage(css: string): void {
  try {
    localStorage.setItem(CUSTOM_THEME_CSS_KEY, css);
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Clear custom theme CSS from localStorage
 */
function clearCustomThemeCSSFromStorage(): void {
  try {
    localStorage.removeItem(CUSTOM_THEME_CSS_KEY);
    // Also remove the preload style element if it exists
    const preloadStyle = document.getElementById(
      'custom-theme-overrides-preload'
    );
    if (preloadStyle) {
      preloadStyle.remove();
    }
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Generate CSS from custom theme token overrides
 * This creates CSS custom properties that override the base theme
 */
function generateCustomThemeCSS(
  baseThemeId: string,
  overrides: ThemeTokenOverrides
): string {
  const cssVars: string[] = [];

  // Brand overrides
  if (overrides.brand) {
    if (overrides.brand.primary) {
      cssVars.push(`  --brand-primary: ${overrides.brand.primary};`);
      cssVars.push(`  --primary: ${overrides.brand.primary};`);
    }
    if (overrides.brand.secondary) {
      cssVars.push(`  --brand-secondary: ${overrides.brand.secondary};`);
      cssVars.push(`  --secondary: ${overrides.brand.secondary};`);
    }
    if (overrides.brand.accent) {
      cssVars.push(`  --brand-accent: ${overrides.brand.accent};`);
      cssVars.push(`  --accent: ${overrides.brand.accent};`);
    }
  }

  // Background overrides
  if (overrides.background) {
    if (overrides.background.page) {
      cssVars.push(`  --bg-page: ${overrides.background.page};`);
      cssVars.push(`  --background: ${overrides.background.page};`);
    }
    if (overrides.background.surface) {
      cssVars.push(`  --bg-surface: ${overrides.background.surface};`);
      cssVars.push(`  --card: ${overrides.background.surface};`);
    }
    if (overrides.background.elevated) {
      cssVars.push(`  --bg-elevated: ${overrides.background.elevated};`);
      cssVars.push(`  --popover: ${overrides.background.elevated};`);
    }
    if (overrides.background.sunken) {
      cssVars.push(`  --bg-sunken: ${overrides.background.sunken};`);
      cssVars.push(`  --muted: ${overrides.background.sunken};`);
    }
  }

  // Text overrides
  if (overrides.text) {
    if (overrides.text.primary) {
      cssVars.push(`  --text-primary: ${overrides.text.primary};`);
      cssVars.push(`  --foreground: ${overrides.text.primary};`);
    }
    if (overrides.text.secondary) {
      cssVars.push(`  --text-secondary: ${overrides.text.secondary};`);
    }
    if (overrides.text.heading) {
      cssVars.push(`  --text-heading: ${overrides.text.heading};`);
    }
    if (overrides.text.muted) {
      cssVars.push(`  --text-muted: ${overrides.text.muted};`);
      cssVars.push(`  --muted-foreground: ${overrides.text.muted};`);
    }
  }

  // Status overrides
  if (overrides.status) {
    if (overrides.status.success) {
      cssVars.push(`  --bg-success: ${overrides.status.success};`);
    }
    if (overrides.status.warning) {
      cssVars.push(`  --bg-warning: ${overrides.status.warning};`);
    }
    if (overrides.status.error) {
      cssVars.push(`  --bg-error: ${overrides.status.error};`);
      cssVars.push(`  --destructive: ${overrides.status.error};`);
    }
    if (overrides.status.info) {
      cssVars.push(`  --bg-info: ${overrides.status.info};`);
    }
  }

  // Shadow overrides
  if (overrides.shadow) {
    if (overrides.shadow.raised) {
      cssVars.push(`  --shadow-raised: ${overrides.shadow.raised};`);
    }
    if (overrides.shadow.floating) {
      cssVars.push(`  --shadow-floating: ${overrides.shadow.floating};`);
    }
  }

  if (cssVars.length === 0) {
    return '';
  }

  // Apply with high specificity to override base theme
  return `:root, .theme-${baseThemeId} {\n${cssVars.join('\n')}\n}`;
}

/**
 * ThemeSync component
 *
 * Syncs theme preferences from Convex to the local theme provider.
 * Should be placed inside ConvexClientProvider and GlobalUserProvider.
 */
export function ThemeSync() {
  const { person, isLoading: isUserLoading } = useGlobalUser();
  const { setThemeById, applyCustomThemeCSS, clearCustomThemeCSS } =
    useGroupiTheme();
  const hasSyncedRef = useRef(false);

  // Only query if user is logged in
  // Using variable assignment to break deep type inference chain
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - TS2589: Type instantiation is excessively deep (intermittent)
  const getPrefsQuery = api.themes.queries.getThemePreferences;
  const getCustomThemesQuery = api.themes.queries.getCustomThemes;
  const prefsArgs = person ? {} : ('skip' as const);
  const customArgs = person ? {} : ('skip' as const);

  const themePreferences = useQuery(
    getPrefsQuery,
    prefsArgs
  ) as ThemePreferences;
  const customThemes = useQuery(
    getCustomThemesQuery,
    customArgs
  ) as CustomThemes;

  // Sync theme when preferences load from DB
  useEffect(() => {
    // Wait for user loading to complete
    if (isUserLoading) return;

    // If no person (not logged in), use localStorage (next-themes default)
    if (!person) {
      hasSyncedRef.current = false;
      return;
    }

    // If we've already synced and data hasn't changed, skip
    if (hasSyncedRef.current && themePreferences === undefined) {
      return;
    }

    // No preferences saved yet - use defaults (let next-themes handle it)
    if (themePreferences === null) {
      hasSyncedRef.current = true;
      return;
    }

    // Have preferences - apply them
    if (themePreferences) {
      hasSyncedRef.current = true;

      if (themePreferences.useSystemPreference) {
        // For system preference, we need to detect current mode and apply appropriate theme
        const isDarkMode = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        const themeId = isDarkMode
          ? themePreferences.systemDarkThemeId
          : themePreferences.systemLightThemeId;
        setThemeById(themeId, false);
        // Clear custom CSS when using system preference
        clearCustomThemeCSS();
        clearCustomThemeCSSFromStorage();
      } else if (themePreferences.selectedThemeType === 'custom') {
        // Apply custom theme
        const customTheme = customThemes?.find(
          t => t._id === themePreferences.selectedCustomThemeId
        );
        if (customTheme) {
          // First apply the base theme
          setThemeById(customTheme.baseThemeId, false);
          // Then overlay custom CSS
          const css = generateCustomThemeCSS(
            customTheme.baseThemeId,
            customTheme.tokenOverrides
          );
          if (css) {
            applyCustomThemeCSS(css);
            // Persist to localStorage for instant load on refresh
            saveCustomThemeCSSToStorage(css);
          }
        } else {
          // Custom theme not found, fall back to selected base theme
          setThemeById(themePreferences.selectedThemeId, false);
          clearCustomThemeCSS();
          clearCustomThemeCSSFromStorage();
        }
      } else {
        // Apply base theme
        setThemeById(themePreferences.selectedThemeId, false);
        clearCustomThemeCSS();
        clearCustomThemeCSSFromStorage();
      }
    }
  }, [
    isUserLoading,
    person,
    themePreferences,
    customThemes,
    setThemeById,
    applyCustomThemeCSS,
    clearCustomThemeCSS,
  ]);

  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (!themePreferences?.useSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const themeId = e.matches
        ? themePreferences.systemDarkThemeId
        : themePreferences.systemLightThemeId;
      setThemeById(themeId, false);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreferences, setThemeById]);

  // This component doesn't render anything
  return null;
}

// Export utilities for use in the theme editor and appearance settings
export {
  generateCustomThemeCSS,
  saveCustomThemeCSSToStorage,
  clearCustomThemeCSSFromStorage,
};
