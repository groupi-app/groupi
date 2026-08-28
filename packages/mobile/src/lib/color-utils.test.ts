import { describe, expect, it } from 'vitest';

import { colorToHex, hsvToHex, parseColorToHsv } from './color-utils';

describe('theme color utilities', () => {
  it('normalizes hex colors', () => {
    expect(colorToHex('#1769ff')).toBe('#1769FF');
    expect(colorToHex('#abc')).toBe('#AABBCC');
  });

  it('converts the HSL values used by base themes', () => {
    expect(colorToHex('hsl(275, 100%, 36%)')).toBe('#6B00B8');
    expect(colorToHex('hsl(210 90% 62% / 0.8)')).toBe('#479EF5');
  });

  it('round-trips HSV picker values', () => {
    const hsv = parseColorToHsv('#00FF80');
    if (!hsv) throw new Error('Expected a valid HSV color');
    expect(hsvToHex(hsv)).toBe('#00FF80');
  });

  it('rejects unsupported values', () => {
    expect(parseColorToHsv('not-a-color')).toBeNull();
  });
});
