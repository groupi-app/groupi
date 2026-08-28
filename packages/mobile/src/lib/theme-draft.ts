import { type ThemeTokenOverrides } from '@groupi/shared/design/themes';

export interface ThemeDraft {
  name: string;
  description: string;
  baseThemeId: string;
  overrides: ThemeTokenOverrides;
}

function serializeStable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(serializeStable).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right)
    );
    return `{${entries
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${serializeStable(entryValue)}`
      )
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function hasThemeDraftChanges(current: ThemeDraft, initial: ThemeDraft) {
  return (
    current.name !== initial.name ||
    current.description !== initial.description ||
    current.baseThemeId !== initial.baseThemeId ||
    serializeStable(current.overrides) !== serializeStable(initial.overrides)
  );
}
