import { describe, expect, it } from 'vitest';
import {
  baseThemeRegistry,
  baseThemes,
  resolveThemePresentation,
} from './index';

const light = baseThemeRegistry['groupi-light'];

describe('theme presentation', () => {
  it.each([
    ['#757575', '#ffffff'],
    ['#ef4444', '#000000'],
  ])(
    'keeps %s action text stable and readable throughout pointer states',
    (fill, text) => {
      const action = resolveThemePresentation(light, {
        brand: { primary: fill },
      }).actions.primary;
      expect(action.foreground).toBe(text);
      expect(action.hoverForeground).toBe(text);
      expect(action.pressedForeground).toBe(text);
    }
  );
  it('preserves sparse chosen fills and pairs light fills with dark text', () => {
    const overrides = { brand: { primary: '#fff' } };
    const before = JSON.stringify(light);
    const result = resolveThemePresentation(light, overrides);
    expect(result.tokens.brand.primary).toBe('#fff');
    expect(result.actions.primary.fill).toBe('#fff');
    expect(result.actions.primary.foreground).toBe('#000000');
    expect(result.actions.primary.contrastVerified).toBe(true);
    expect(result.actions.secondary.fill).toBe(light.tokens.legacy.secondary);
    expect(JSON.stringify(light)).toBe(before);
    expect(overrides).toEqual({ brand: { primary: '#fff' } });
  });
  it('derives interaction states independently of legacy saved hover hints', () => {
    const overrides = { brand: { primary: '#fff', primaryHover: '#000' } };
    const result = resolveThemePresentation(light, overrides);
    expect(result.tokens.brand.primaryHover).toBe(
      light.tokens.brand.primaryHover
    );
    expect(result.actions.primary.hover).not.toBe('#000');
    expect(overrides.brand.primaryHover).toBe('#000');
  });
  it('applies saved surface and text overrides to both semantic and compatibility tokens', () => {
    const result = resolveThemePresentation(light, {
      background: {
        page: '#111',
        surface: '#222',
        elevated: '#333',
        sunken: '#000',
      },
      text: { primary: '#eee', muted: '#aaa' },
    });
    expect(result.tokens.legacy.background).toBe('#111');
    expect(result.tokens.legacy.card).toBe('#222');
    expect(result.tokens.legacy.popover).toBe('#333');
    expect(result.tokens.legacy.muted).toBe('#000');
    expect(result.tokens.legacy.foreground).toBe('#eee');
    expect(result.tokens.legacy.mutedForeground).toBe('#aaa');
    expect(result.tokens.text.onPrimary).toBe(light.tokens.text.onPrimary);
  });
  it('composites transparent fills over their actual surface, including page alpha', () => {
    const result = resolveThemePresentation(light, {
      background: { page: '#fff', surface: 'rgb(0 0 0 / 50%)' },
      brand: { primary: 'rgba(255, 255, 255, 0)' },
    });
    expect(result.surface).toBe('rgb(128 128 128)');
    expect(result.actions.primary.fill).toBe('rgba(255, 255, 255, 0)');
    expect(result.actions.primary.compositedFill).toBe('rgb(128 128 128)');
    expect(result.actions.primary.foreground).toBe('#000000');
    expect(result.actions.primary.contrastVerified).toBe(true);
    const dark = resolveThemePresentation(light, {
      background: { surface: '#000' },
      brand: { primary: '#ffffff00' },
    });
    expect(dark.actions.primary.foreground).toBe('#ffffff');
  });
  it('does not claim verified contrast for unresolved colors or surfaces', () => {
    for (const color of [
      'var(--user-color)',
      'color(display-p3 1 0 0)',
      'hsl(nope)',
      'rgb(1 2 NaN)',
      'rgb(1,,,2,3)',
      'rgb(1 2 3 0.5)',
    ]) {
      const result = resolveThemePresentation(light, {
        brand: { primary: color },
      });
      expect(result.actions.primary.fill).toBe(color);
      expect(result.actions.primary.contrastVerified).toBe(false);
      expect(result.actions.primary.hover).not.toContain('NaN');
    }
    expect(
      resolveThemePresentation(light, {
        background: { page: 'var(--page)', surface: 'transparent' },
      }).actions.primary.contrastVerified
    ).toBe(false);
  });
  it.each([
    ['#000', '#ffffff'],
    ['#ffff', '#000000'],
    ['rgb(100% 100% 0%)', '#000000'],
    ['hsl(240.5 100% 50%)', '#ffffff'],
    ['hsla(0, 0%, 100%, 0)', '#000000'],
  ])('pairs %s with its known readable foreground', (fill, text) => {
    const action = resolveThemePresentation(light, { brand: { primary: fill } })
      .actions.primary;
    expect(action.foreground).toBe(text);
    expect(action.contrastVerified).toBe(true);
    if (fill === '#000') expect(action.backing).not.toBe('rgb(0 0 0)');
  });
  it.each([
    '#000',
    '#fff',
    '#757575',
    '#ef4444',
    'rgba(255, 0, 0, 0.5)',
    'hsla(285, 100%, 34%, 0.25)',
  ])(
    'keeps custom %s fills resolved and readable without changing text between states',
    fill => {
      const action = resolveThemePresentation(light, {
        brand: { primary: fill },
      }).actions.primary;
      expect(action.fill).toBe(fill);
      expect(action.hoverForeground).toBe(action.foreground);
      expect(action.pressedForeground).toBe(action.foreground);
      for (const state of [
        action.compositedFill,
        action.hover,
        action.pressed,
      ]) {
        const [red, green, blue] = state
          .match(/\d+/g)!
          .map(Number)
          .map(channel => channel / 255)
          .map(channel =>
            channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4
          );
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        const contrast =
          action.foreground === '#000000'
            ? (luminance + 0.05) / 0.05
            : 1.05 / (luminance + 0.05);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    }
  );
  it.each(baseThemes)('provides safe, distinct state pairs for $id', base => {
    const result = resolveThemePresentation(base);
    for (const action of Object.values(result.actions)) {
      expect(action.contrastVerified).toBe(true);
      expect(action.hoverForeground).toBe(action.foreground);
      expect(action.pressedForeground).toBe(action.foreground);
      for (const [fill, text] of [
        [action.compositedFill, action.foreground],
        [action.hover, action.hoverForeground],
        [action.pressed, action.pressedForeground],
        [action.subtle, action.subtleForeground],
      ]) {
        const channels = fill
          .match(/\d+/g)!
          .map(Number)
          .map(c => c / 255)
          .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        const luminance =
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        const contrast =
          text === '#000000'
            ? (luminance + 0.05) / 0.05
            : 1.05 / (luminance + 0.05);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      expect(action.hover).not.toBe(action.pressed);
    }
  });
});
