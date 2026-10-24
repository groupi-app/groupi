import type { BaseTheme, ThemeTokenOverrides } from './types';

type Color = [number, number, number, number];
const BLACK: Color = [0, 0, 0, 1];
const WHITE: Color = [255, 255, 255, 1];
const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));

function parseColor(input: string): Color | undefined {
  const value = input.trim().toLowerCase();
  const hex = value.match(
    /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i
  )?.[1];
  if (!hex) {
    if (value === 'white') return WHITE;
    if (value === 'black') return BLACK;
    if (value === 'transparent') return [0, 0, 0, 0];
    const match = value.match(/^(rgb|rgba|hsl|hsla)\((.*)\)$/);
    if (!match) return undefined;
    const body = match[2].trim();
    const commaSyntax = body.includes(',');
    if (commaSyntax && body.includes('/')) return undefined;
    if (!commaSyntax && (body.match(/\//g)?.length ?? 0) > 1) return undefined;
    const parts = commaSyntax
      ? body.split(',').map(part => part.trim())
      : body.replace(/\s*\/\s*/, ' / ').split(/\s+/);
    if (!commaSyntax && parts.length > 3) {
      if (parts.length !== 5 || parts[3] !== '/') return undefined;
      parts.splice(3, 1);
    }
    if (parts.length !== 3 && parts.length !== 4) return undefined;
    const numeric = /^[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?%?$/i;
    if (parts.some(part => !numeric.test(part))) return undefined;
    const numbers = parts.map(parseFloat);
    if (numbers.some(n => !Number.isFinite(n))) return undefined;
    const alpha = parts[3]
      ? clamp(numbers[3] / (parts[3].endsWith('%') ? 100 : 1))
      : 1;
    if (match[1].startsWith('rgb')) {
      const channels = parts
        .slice(0, 3)
        .map((part, i) =>
          clamp(numbers[i] * (part.endsWith('%') ? 2.55 : 1), 255)
        );
      return [channels[0], channels[1], channels[2], alpha];
    }
    if (
      !parts[1].endsWith('%') ||
      !parts[2].endsWith('%') ||
      parts[0].endsWith('%')
    )
      return undefined;
    const hue = (((numbers[0] % 360) + 360) % 360) / 60;
    const saturation = clamp(numbers[1] / 100);
    const lightness = clamp(numbers[2] / 100);
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs((hue % 2) - 1));
    const m = lightness - chroma / 2;
    const rgb =
      hue < 1
        ? [chroma, x, 0]
        : hue < 2
          ? [x, chroma, 0]
          : hue < 3
            ? [0, chroma, x]
            : hue < 4
              ? [0, x, chroma]
              : hue < 5
                ? [x, 0, chroma]
                : [chroma, 0, x];
    return [(rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255, alpha];
  }
  const expanded = hex.length < 5 ? [...hex].map(c => c + c).join('') : hex;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
    expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1,
  ];
}

function composite(color: Color, background: Color): Color {
  return [
    color[0] * color[3] + background[0] * (1 - color[3]),
    color[1] * color[3] + background[1] * (1 - color[3]),
    color[2] * color[3] + background[2] * (1 - color[3]),
    1,
  ];
}

function luminance(color: Color) {
  const channels = color.slice(0, 3).map(value => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function foreground(color: Color) {
  const light = luminance(color);
  return (light + 0.05) / 0.05 >= 1.05 / (light + 0.05) ? '#000000' : '#ffffff';
}

function mix(color: Color, target: Color, amount: number): Color {
  return [
    color[0] * (1 - amount) + target[0] * amount,
    color[1] * (1 - amount) + target[1] * amount,
    color[2] * (1 - amount) + target[2] * amount,
    1,
  ];
}
const css = (color: Color) =>
  `rgb(${color.slice(0, 3).map(Math.round).join(' ')})`;

/**
 * Resolve sparse saved values and opt-in presentation without mutating inputs.
 * Foregrounds meet 4.5:1 against each fill/state over the returned opaque surface.
 * Adapters must layer that surface beneath alpha fills (surface → page → mode
 * fallback), so controls retain their pairing on page/elevated backgrounds.
 * Supports sRGB hex, RGB/HSL (comma or space syntax), alpha, black/white/transparent.
 * Unknown syntax keeps the chosen fill; deterministic fallback states carry
 * contrastVerified=false. This is not a compliance claim for unresolved CSS or
 * for controls placed on a different background. States are never persisted.
 * Legacy saved hover hints are intentionally superseded by common derivation;
 * existing default token values remain available until the staged migration.
 */
export function resolveThemePresentation(
  base: BaseTheme,
  overrides: ThemeTokenOverrides = {}
) {
  const source = base.tokens;
  const tokens = {
    ...source,
    brand: {
      ...source.brand,
      primary: overrides.brand?.primary ?? source.brand.primary,
      secondary: overrides.brand?.secondary ?? source.brand.secondary,
      accent: overrides.brand?.accent ?? source.brand.accent,
    },
    background: {
      ...source.background,
      ...overrides.background,
      ...overrides.status,
    },
    text: { ...source.text, ...overrides.text },
    border: { ...source.border },
    state: { ...source.state },
    fun: { ...source.fun },
    shadow: { ...source.shadow, ...overrides.shadow },
    legacy: {
      ...source.legacy,
      background: overrides.background?.page ?? source.legacy.background,
      card: overrides.background?.surface ?? source.legacy.card,
      popover: overrides.background?.elevated ?? source.legacy.popover,
      muted: overrides.background?.sunken ?? source.legacy.muted,
      foreground: overrides.text?.primary ?? source.legacy.foreground,
      cardForeground: overrides.text?.primary ?? source.legacy.cardForeground,
      popoverForeground:
        overrides.text?.primary ?? source.legacy.popoverForeground,
      mutedForeground: overrides.text?.muted ?? source.legacy.mutedForeground,
      primary: overrides.brand?.primary ?? source.legacy.primary,
      secondary: overrides.brand?.secondary ?? source.legacy.secondary,
      accent: overrides.brand?.accent ?? source.legacy.accent,
      destructive: overrides.status?.error ?? source.legacy.destructive,
    },
  };
  const fallback = base.mode === 'dark' ? BLACK : WHITE;
  const pageColor = parseColor(tokens.background.page);
  const page = composite(pageColor ?? fallback, fallback);
  const surfaceColor = parseColor(tokens.background.surface);
  const surface = composite(surfaceColor ?? page, page);
  function treatment(fill: string) {
    const parsed = parseColor(fill);
    const color = composite(parsed ?? fallback, surface);
    const target = foreground(color) === '#ffffff' ? WHITE : BLACK;
    const hover = mix(color, target, 0.06);
    const pressed = mix(color, target, 0.12);
    const subtle = mix(surface, color, 0.12);
    return {
      fill,
      foreground: foreground(color),
      hover: css(hover),
      hoverForeground: foreground(hover),
      pressed: css(pressed),
      pressedForeground: foreground(pressed),
      backing: css(mix(color, luminance(color) < 0.08 ? WHITE : BLACK, 0.24)),
      subtle: css(subtle),
      subtleForeground: foreground(subtle),
      contrastVerified:
        !!parsed && !!surfaceColor && (surfaceColor[3] === 1 || !!pageColor),
    };
  }
  return {
    tokens,
    surface: css(surface),
    actions: {
      primary: treatment(tokens.legacy.primary),
      secondary: treatment(tokens.legacy.secondary),
      accent: treatment(tokens.legacy.accent),
      destructive: treatment(tokens.legacy.destructive),
      success: treatment(tokens.background.success),
      warning: treatment(tokens.background.warning),
      info: treatment(tokens.background.info),
    },
  };
}
