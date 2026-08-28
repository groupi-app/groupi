import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReturnType } from 'convex/server';
import { Uniwind } from 'uniwind';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import {
  type ThemeTokens,
  type ThemeTokenOverrides,
  baseThemeRegistry,
  DEFAULT_LIGHT_THEME_ID,
} from '@groupi/shared/design/themes';
import { normalizeMobileThemePreference } from './theme-preference';

type ThemePreference = FunctionArgs<
  typeof api.themes.mutations.saveThemePreference
>;
export type MobileCustomTheme = FunctionReturnType<
  typeof api.themes.queries.getCustomThemes
>[number];

interface ThemeContextValue {
  themeId: string;
  selectedThemeId: string;
  selectedThemeType: 'base' | 'custom';
  selectedCustomThemeId?: Id<'customThemes'>;
  customThemes: MobileCustomTheme[];
  tokens: ThemeTokens;
  isDark: boolean;
  isLoading: boolean;
  isSaving: boolean;
  setTheme: (
    id: string,
    customThemeId?: Id<'customThemes'>
  ) => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function tokensToCssVars(
  tokens: ThemeTokens,
  overrides?: ThemeTokenOverrides
): Record<string, string> {
  return {
    '--color-primary': overrides?.brand?.primary ?? tokens.brand.primary,
    '--color-primary-hover': tokens.brand.primaryHover,
    '--color-primary-foreground': tokens.text.onPrimary ?? 'hsl(0, 0%, 100%)',
    '--color-secondary': tokens.legacy.secondary,
    '--color-secondary-foreground': tokens.legacy.secondaryForeground,
    '--color-accent': tokens.legacy.accent,
    '--color-accent-foreground': tokens.legacy.accentForeground,
    '--color-background': overrides?.background?.page ?? tokens.background.page,
    '--color-foreground': overrides?.text?.primary ?? tokens.text.primary,
    '--color-card': overrides?.background?.surface ?? tokens.background.surface,
    '--color-card-foreground': overrides?.text?.primary ?? tokens.text.primary,
    '--color-popover':
      overrides?.background?.elevated ?? tokens.background.elevated,
    '--color-popover-foreground':
      overrides?.text?.primary ?? tokens.text.primary,
    '--color-muted':
      overrides?.background?.sunken ?? tokens.background.interactive,
    '--color-muted-foreground':
      overrides?.text?.muted ?? tokens.text.muted ?? tokens.text.secondary,
    '--color-bg-surface':
      overrides?.background?.surface ?? tokens.background.surface,
    '--color-bg-elevated':
      overrides?.background?.elevated ?? tokens.background.elevated,
    '--color-bg-sunken':
      overrides?.background?.sunken ?? tokens.background.sunken,
    '--color-bg-interactive': tokens.background.interactive,
    '--color-bg-overlay': tokens.background.overlay,
    '--color-success': overrides?.status?.success ?? tokens.background.success,
    '--color-bg-success-subtle': tokens.background.successSubtle,
    '--color-warning': overrides?.status?.warning ?? tokens.background.warning,
    '--color-bg-warning-subtle': tokens.background.warningSubtle,
    '--color-error': overrides?.status?.error ?? tokens.background.error,
    '--color-bg-error-subtle': tokens.background.errorSubtle,
    '--color-info': overrides?.status?.info ?? tokens.background.info,
    '--color-bg-info-subtle': tokens.background.infoSubtle,
    '--color-destructive': overrides?.status?.error ?? tokens.background.error,
    '--color-destructive-foreground':
      tokens.text.onPrimary ?? 'hsl(0, 0%, 100%)',
    '--color-text-secondary':
      overrides?.text?.secondary ?? tokens.text.secondary,
    '--color-text-tertiary': tokens.text.tertiary,
    '--color-text-success': tokens.text.success,
    '--color-text-warning': tokens.text.warning,
    '--color-text-error': tokens.text.error,
    '--color-text-info': tokens.text.link,
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

function applyTheme(tokens: ThemeTokens, mode: 'light' | 'dark') {
  Uniwind.updateCSSVariables(mode, tokensToCssVars(tokens));
  Uniwind.setTheme(mode);
}

function applyCustomTheme(
  tokens: ThemeTokens,
  overrides: ThemeTokenOverrides,
  mode: 'light' | 'dark'
) {
  Uniwind.updateCSSVariables(mode, tokensToCssVars(tokens, overrides));
  Uniwind.setTheme(mode);
}

function preferencesMatch(
  saved: FunctionReturnType<typeof api.themes.queries.getThemePreferences>,
  pending: ThemePreference
) {
  return (
    saved?.selectedThemeType === pending.selectedThemeType &&
    saved.selectedThemeId === pending.selectedThemeId &&
    saved.selectedCustomThemeId === pending.selectedCustomThemeId &&
    saved.useSystemPreference === pending.useSystemPreference &&
    saved.systemLightThemeId === pending.systemLightThemeId &&
    saved.systemDarkThemeId === pending.systemDarkThemeId
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const savedPreference = useQuery(
    api.themes.queries.getThemePreferences,
    isAuthenticated ? {} : 'skip'
  );
  const customThemesResult = useQuery(
    api.themes.queries.getCustomThemes,
    isAuthenticated ? {} : 'skip'
  );
  const saveThemePreference = useMutation(
    api.themes.mutations.saveThemePreference
  );
  const [pendingPreference, setPendingPreference] =
    useState<ThemePreference | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const preferenceSource = pendingPreference ?? savedPreference;
  const preference = useMemo(
    () => normalizeMobileThemePreference(preferenceSource),
    [preferenceSource]
  );
  const customThemes = useMemo(
    () => customThemesResult ?? [],
    [customThemesResult]
  );

  const selectedCustomTheme =
    preference.selectedThemeType === 'custom'
      ? customThemes.find(
          theme =>
            theme._id === preference.selectedCustomThemeId ||
            theme._id === preference.selectedThemeId
        )
      : undefined;
  const baseThemeId =
    selectedCustomTheme?.baseThemeId ?? preference.selectedThemeId;
  const activeTheme =
    baseThemeRegistry[baseThemeId] ?? baseThemeRegistry[DEFAULT_LIGHT_THEME_ID];
  const resolvedThemeId = selectedCustomTheme?._id ?? activeTheme.id;

  useEffect(() => {
    if (selectedCustomTheme) {
      applyCustomTheme(
        activeTheme.tokens,
        selectedCustomTheme.tokenOverrides,
        selectedCustomTheme.mode
      );
      return;
    }
    applyTheme(activeTheme.tokens, activeTheme.mode);
  }, [activeTheme, selectedCustomTheme]);

  useEffect(() => {
    if (
      pendingPreference &&
      savedPreference &&
      preferencesMatch(savedPreference, pendingPreference)
    ) {
      setPendingPreference(null);
    }
  }, [pendingPreference, savedPreference]);

  const persistPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      const mutationPayload = normalizeMobileThemePreference(nextPreference);
      setPendingPreference(mutationPayload);
      setIsSaving(true);
      try {
        await saveThemePreference(mutationPayload);
        return true;
      } catch {
        setPendingPreference(null);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [saveThemePreference]
  );

  const setTheme = useCallback(
    async (id: string, customThemeId?: Id<'customThemes'>) =>
      persistPreference({
        selectedThemeType: customThemeId ? 'custom' : 'base',
        selectedThemeId: id,
        selectedCustomThemeId: customThemeId,
        useSystemPreference: false,
        systemLightThemeId: preference.systemLightThemeId,
        systemDarkThemeId: preference.systemDarkThemeId,
      }),
    [persistPreference, preference]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: resolvedThemeId,
      selectedThemeId: preference.selectedThemeId,
      selectedThemeType: preference.selectedThemeType,
      selectedCustomThemeId: preference.selectedCustomThemeId,
      customThemes,
      tokens: activeTheme.tokens,
      isDark: activeTheme.mode === 'dark',
      isLoading:
        isAuthLoading ||
        (isAuthenticated &&
          (savedPreference === undefined || customThemesResult === undefined)),
      isSaving,
      setTheme,
    }),
    [
      activeTheme,
      customThemes,
      customThemesResult,
      isAuthLoading,
      isAuthenticated,
      isSaving,
      preference,
      resolvedThemeId,
      savedPreference,
      setTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
