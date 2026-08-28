import type { Id } from 'convex/_generated/dataModel';
import {
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
} from '@groupi/shared/design/themes';

export interface MobileThemePreference {
  selectedThemeType: 'base' | 'custom';
  selectedThemeId: string;
  selectedCustomThemeId?: Id<'customThemes'>;
  useSystemPreference: boolean;
  systemLightThemeId: string;
  systemDarkThemeId: string;
}

interface ThemePreferenceSource {
  selectedThemeType?: 'base' | 'custom';
  selectedThemeId?: string;
  selectedCustomThemeId?: Id<'customThemes'>;
  systemLightThemeId?: string;
  systemDarkThemeId?: string;
}

/**
 * Produces the exact mutation payload expected by Convex.
 *
 * Persisted Convex documents also include metadata such as `_id`,
 * `_creationTime`, `personId`, and `updatedAt`. Rebuilding the payload here
 * prevents those document-only fields from leaking back into mutation args.
 */
export function normalizeMobileThemePreference(
  source?: ThemePreferenceSource | null
): MobileThemePreference {
  return {
    selectedThemeType: source?.selectedThemeType ?? 'base',
    selectedThemeId: source?.selectedThemeId ?? DEFAULT_LIGHT_THEME_ID,
    selectedCustomThemeId: source?.selectedCustomThemeId,
    // Mobile deliberately uses one explicitly selected theme.
    useSystemPreference: false,
    // Retained in the payload for compatibility with the shared web/API model.
    systemLightThemeId: source?.systemLightThemeId ?? DEFAULT_LIGHT_THEME_ID,
    systemDarkThemeId: source?.systemDarkThemeId ?? DEFAULT_DARK_THEME_ID,
  };
}
