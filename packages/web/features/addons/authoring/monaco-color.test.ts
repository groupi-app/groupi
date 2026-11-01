import { describe, expect, it } from 'vitest';
import { normalizeMonacoHexColor } from './monaco-color';

describe('CSS colors at the Monaco theme boundary', () => {
  it.each([
    ['#fff', '#ffffff'],
    ['#abc', '#aabbcc'],
    ['#A0f', '#AA00ff'],
    ['#fffa', '#ffffffaa'],
    ['#1234', '#11223344'],
    ['#aabbcc', '#aabbcc'],
    ['#00000000', '#00000000'],
  ])('normalizes %s without changing its color', (css, expected) => {
    const result = normalizeMonacoHexColor(css);
    expect(result).toBe(expected);
    expect(result).toMatch(/^#[\da-f]{6}([\da-f]{2})?$/i);
  });

  it.each(['#ff', '#fffff', '#ggg', '#1234567', '#NaNNaNNaN', 'red', ''])(
    'rejects an unsupported token color %s so the caller can use its fallback',
    css => {
      expect(normalizeMonacoHexColor(css)).toBeUndefined();
    }
  );
});
