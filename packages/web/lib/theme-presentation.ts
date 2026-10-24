import {
  resolveThemePresentation,
  type BaseTheme,
  type ThemeTokenOverrides,
} from '@groupi/shared/design/themes';

/** Opt-in variables shared by generated themes, saved themes and the gallery.
 * Existing component defaults do not reference these until visual approval.
 */
export function getThemePresentationVariables(
  base: BaseTheme,
  overrides: ThemeTokenOverrides = {}
) {
  const { actions, surface } = resolveThemePresentation(base, overrides);
  const variables: Record<string, string> = {
    '--soft-action-surface': surface,
  };
  for (const [role, treatment] of Object.entries(actions)) {
    for (const [state, value] of Object.entries(treatment)) {
      if (typeof value !== 'string') continue;
      const name = state.replace(
        /[A-Z]/g,
        character => `-${character.toLowerCase()}`
      );
      variables[`--soft-${role}-${name}`] = value;
    }
  }
  return variables;
}
