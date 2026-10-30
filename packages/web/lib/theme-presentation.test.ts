// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { baseThemeRegistry } from '@groupi/shared/design/themes';
import { getThemePresentationVariables } from './theme-presentation';
import { generateCompleteCustomThemeCSS } from './theme-css';

const base = baseThemeRegistry['groupi-light'];

describe('web theme presentation adapter', () => {
  it('emits opt-in action variables and preserves existing custom CSS defaults', () => {
    const overrides = { brand: { primary: '#fff' } };
    const variables = getThemePresentationVariables(base, overrides);
    const css = generateCompleteCustomThemeCSS('test', base, overrides);
    expect(variables['--soft-primary-fill']).toBe('#fff');
    expect(variables['--soft-primary-composited-fill']).toBe(
      'rgb(255 255 255)'
    );
    expect(variables['--soft-primary-foreground']).toBe('#000000');
    expect(css).toContain('--soft-primary-foreground: #000000;');
    expect(css).toContain(
      `--primary-foreground: ${base.tokens.legacy.primaryForeground.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/g, 'hsl($1 $2% $3%)')};`
    );
    expect(css).toContain('--primary: #fff;');
  });
  it('ships equivalent generated presentation variables for bundled themes', () => {
    const generated = readFileSync(
      new URL('../styles/_generated-tokens.css', import.meta.url),
      'utf8'
    );
    const themeBlock = generated
      .split('.theme-groupi-light {')[1]
      .split('\n}')[0];
    for (const [key, value] of Object.entries(
      getThemePresentationVariables(base)
    )) {
      expect(themeBlock).toContain(`${key}: ${value};`);
    }
  });
});
