'use client';

import { useEffect, useRef } from 'react';
import { generateCompleteCustomThemeCSS } from '@/lib/theme-css';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useGroupiTheme } from '@/providers/theme-provider';
import { useGlobalUser } from '@/context/global-user-context';
import { baseThemeRegistry } from '@groupi/shared/design/themes';

export { generateCompleteCustomThemeCSS } from '@/lib/theme-css';

// =============================================================================
// TYPES
// =============================================================================

type ThemePreferences = Doc<'themePreferences'> | null | undefined;
type CustomTheme = Doc<'customThemes'>;
type CustomThemes = CustomTheme[] | undefined;

// =============================================================================
// THEME SYNC COMPONENT
// =============================================================================

/**
 * ThemeSync - Syncs theme preferences from Convex to the theme provider.
 *
 * Responsibilities:
 * - Fetch user's theme preferences from database
 * - Generate custom theme CSS when needed
 * - Apply themes via the theme provider
 * - Handle account switching
 */
export function ThemeSync() {
  const { person, isLoading: isUserLoading } = useGlobalUser();
  const {
    setBaseTheme,
    setCustomTheme,
    setSystemPreference,
    clearCustomThemeCSS,
  } = useGroupiTheme();

  const hasSyncedRef = useRef(false);
  const lastPersonIdRef = useRef<string | null>(null);
  const currentPersonId = person?._id ?? null;

  // Reset sync state when person changes (account switch)
  useEffect(() => {
    if (currentPersonId !== lastPersonIdRef.current) {
      lastPersonIdRef.current = currentPersonId;
      hasSyncedRef.current = false;
    }
  }, [currentPersonId]);

  // Queries - only run when logged in
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

  // Sync theme when preferences load
  useEffect(() => {
    console.log(
      '[ThemeSync] useEffect running at',
      performance.now().toFixed(2) + 'ms'
    );
    console.log(
      '[ThemeSync] isUserLoading:',
      isUserLoading,
      'person:',
      !!person
    );
    console.log('[ThemeSync] themePreferences:', themePreferences);

    // Wait for user loading to complete
    if (isUserLoading) {
      console.log('[ThemeSync] Still loading user, returning early');
      return;
    }

    // Not logged in - let provider use localStorage defaults
    if (!person) {
      console.log('[ThemeSync] No person, using localStorage defaults');
      hasSyncedRef.current = false;
      return;
    }

    // Already synced and waiting for data
    if (hasSyncedRef.current && themePreferences === undefined) {
      console.log('[ThemeSync] Already synced, waiting for data');
      return;
    }

    // No preferences saved - use defaults
    if (themePreferences === null) {
      console.log('[ThemeSync] No preferences saved, using defaults');
      hasSyncedRef.current = true;
      return;
    }

    // Apply preferences
    if (themePreferences) {
      console.log(
        '[ThemeSync] Applying preferences, type:',
        themePreferences.selectedThemeType
      );

      if (themePreferences.useSystemPreference) {
        // System preference mode
        hasSyncedRef.current = true;
        console.log('[ThemeSync] Setting system preference');
        setSystemPreference(
          themePreferences.systemLightThemeId,
          themePreferences.systemDarkThemeId
        );
      } else if (themePreferences.selectedThemeType === 'custom') {
        // Custom theme - wait for customThemes to load before doing anything
        // This prevents flashing the base theme while customThemes is loading
        if (customThemes === undefined) {
          console.log('[ThemeSync] Waiting for customThemes to load...');
          return; // Don't mark as synced, don't apply fallback - just wait
        }

        const customTheme = customThemes.find(
          t => t._id === themePreferences.selectedCustomThemeId
        );
        console.log('[ThemeSync] Custom theme found:', !!customTheme);

        hasSyncedRef.current = true;

        if (customTheme) {
          const baseTheme = baseThemeRegistry[customTheme.baseThemeId];
          console.log(
            '[ThemeSync] Base theme for custom:',
            customTheme.baseThemeId,
            !!baseTheme
          );
          if (baseTheme) {
            const css = generateCompleteCustomThemeCSS(
              customTheme._id,
              baseTheme,
              customTheme.tokenOverrides
            );
            console.log('[ThemeSync] Generated CSS length:', css.length);
            console.log('[ThemeSync] CSS starts with:', css.substring(0, 60));
            setCustomTheme(customTheme._id, css);
            console.log(
              '[ThemeSync] Called setCustomTheme at',
              performance.now().toFixed(2) + 'ms'
            );
          } else {
            // Base theme not found, fall back to selected base theme
            console.log(
              '[ThemeSync] Base theme registry lookup failed, falling back'
            );
            setBaseTheme(themePreferences.selectedThemeId);
          }
        } else {
          // Custom theme was deleted or not found, fall back to selected base theme
          console.log(
            '[ThemeSync] Custom theme not in list, falling back to base theme'
          );
          setBaseTheme(themePreferences.selectedThemeId);
        }
      } else {
        // Base theme
        hasSyncedRef.current = true;
        setBaseTheme(themePreferences.selectedThemeId);
      }
    }
  }, [
    isUserLoading,
    person,
    themePreferences,
    customThemes,
    setBaseTheme,
    setCustomTheme,
    setSystemPreference,
    clearCustomThemeCSS,
  ]);

  return null;
}
