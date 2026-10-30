vi.unmock('@groupi/shared/design/themes');
import { describe, expect, it, vi } from 'vitest';
import {
  baseThemeRegistry,
  resolveThemePresentation,
} from '@groupi/shared/design/themes';
vi.mock('uniwind', () => ({
  Uniwind: { setTheme: vi.fn(), updateCSSVariables: vi.fn() },
}));
import { tokensToCssVars } from './theme-provider';

describe('native theme presentation adapter', () => {
  for (const base of Object.values(baseThemeRegistry)) {
    it(`maps derived action states and white edges for ${base.id}`, () => {
      const overrides = {
        brand: { primary: '#f8e9af' },
        status: { error: '#ffeedd' },
      };
      const resolved = resolveThemePresentation(base, overrides);
      const vars = tokensToCssVars(base, overrides);
      expect(vars['--color-sticker-edge']).toBe('hsl(0, 0%, 100%)');
      for (const [name, action] of Object.entries(resolved.actions)) {
        expect(vars[`--color-${name}`]).toBe(action.compositedFill);
        expect(vars[`--color-${name}-foreground`]).toBe(action.foreground);
        expect(vars[`--color-${name}-pressed`]).toBe(action.pressed);
      }
      expect(vars['--color-destructive-foreground']).toBe('#000000');
    });
  }
});
