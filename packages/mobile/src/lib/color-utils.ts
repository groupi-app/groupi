export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = clamp(r / 255);
  const green = clamp(g / 255);
  const blue = clamp(b / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  return {
    h: hue,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation);
  const l = clamp(lightness);
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  let values: [number, number, number];

  if (h < 60) values = [chroma, x, 0];
  else if (h < 120) values = [x, chroma, 0];
  else if (h < 180) values = [0, chroma, x];
  else if (h < 240) values = [0, x, chroma];
  else if (h < 300) values = [x, 0, chroma];
  else values = [chroma, 0, x];

  return {
    r: (values[0] + match) * 255,
    g: (values[1] + match) * 255,
    b: (values[2] + match) * 255,
  };
}

function parseHex(value: string): RgbColor | null {
  const hex = value.replace('#', '');
  if (![3, 4, 6, 8].includes(hex.length) || !/^[\da-f]+$/i.test(hex)) {
    return null;
  }

  const expanded =
    hex.length <= 4
      ? hex
          .slice(0, 3)
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : hex.slice(0, 6);

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function parseRgb(value: string): RgbColor | null {
  const match = value.match(/^rgba?\((.*)\)$/i);
  if (!match) return null;
  const components = match[1]
    .replace(/\s*\/\s*.*/, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3);
  if (components.length !== 3) return null;

  const numbers = components.map(component => {
    const numeric = Number.parseFloat(component);
    return component.endsWith('%') ? (numeric / 100) * 255 : numeric;
  });
  if (numbers.some(number => !Number.isFinite(number))) return null;

  return { r: numbers[0], g: numbers[1], b: numbers[2] };
}

function parseHsl(value: string): RgbColor | null {
  const match = value.match(/^hsla?\((.*)\)$/i);
  if (!match) return null;
  const components = match[1]
    .replace(/\s*\/\s*.*/, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3);
  if (components.length !== 3) return null;

  const hue = Number.parseFloat(components[0]);
  const saturation = Number.parseFloat(components[1]);
  const lightness = Number.parseFloat(components[2]);
  if (
    !Number.isFinite(hue) ||
    !Number.isFinite(saturation) ||
    !Number.isFinite(lightness)
  ) {
    return null;
  }

  return hslToRgb(hue, saturation / 100, lightness / 100);
}

export function parseColorToHsv(value: string): HsvColor | null {
  const normalized = value.trim();
  const rgb = normalized.startsWith('#')
    ? parseHex(normalized)
    : normalized.toLowerCase().startsWith('rgb')
      ? parseRgb(normalized)
      : normalized.toLowerCase().startsWith('hsl')
        ? parseHsl(normalized)
        : null;

  return rgb ? rgbToHsv(rgb) : null;
}

export function hsvToHex({ h, s, v }: HsvColor) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s);
  const value = clamp(v);
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = value - chroma;
  let values: [number, number, number];

  if (hue < 60) values = [chroma, x, 0];
  else if (hue < 120) values = [x, chroma, 0];
  else if (hue < 180) values = [0, chroma, x];
  else if (hue < 240) values = [0, x, chroma];
  else if (hue < 300) values = [x, 0, chroma];
  else values = [chroma, 0, x];

  const hex = values
    .map(channel =>
      Math.round((channel + match) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('');
  return `#${hex.toUpperCase()}`;
}

export function colorToHex(value: string) {
  const hsv = parseColorToHsv(value);
  return hsv ? hsvToHex(hsv) : null;
}

export function isHexColor(value: string) {
  return /^(?:#[\da-f]{3}|#[\da-f]{6})$/i.test(value.trim());
}
