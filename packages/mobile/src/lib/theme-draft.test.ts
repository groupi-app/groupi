import { describe, expect, it } from 'vitest';

import { hasThemeDraftChanges, type ThemeDraft } from './theme-draft';

const initial: ThemeDraft = {
  name: 'Custom theme',
  description: 'My colors',
  baseThemeId: 'groupi-light',
  overrides: {
    brand: { primary: '#2563EB', accent: '#F59E0B' },
  },
};

describe('theme draft changes', () => {
  it('does not treat equivalent token ordering as a change', () => {
    expect(
      hasThemeDraftChanges(
        {
          ...initial,
          overrides: {
            brand: { accent: '#F59E0B', primary: '#2563EB' },
          },
        },
        initial
      )
    ).toBe(false);
  });

  it.each([
    [{ ...initial, name: 'Renamed' }, 'name'],
    [{ ...initial, description: 'Updated' }, 'description'],
    [{ ...initial, baseThemeId: 'midnight' }, 'base theme'],
    [
      {
        ...initial,
        overrides: { brand: { primary: '#EF4444', accent: '#F59E0B' } },
      },
      'color',
    ],
  ])('detects a changed %s', current => {
    expect(hasThemeDraftChanges(current as ThemeDraft, initial)).toBe(true);
  });
});
