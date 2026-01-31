/**
 * Token Generation Script
 *
 * Reads design tokens from @groupi/shared and generates CSS custom properties.
 * This ensures the TypeScript token files are the single source of truth.
 *
 * Generates CSS for all base themes with class selectors:
 * - :root (default light theme)
 * - .theme-groupi-light, .theme-groupi-dark, .theme-ocean-light, .theme-ocean-dark
 * - .dark (legacy - maps to default dark theme)
 *
 * Usage: npx tsx scripts/generate-tokens.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  baseThemes,
  sharedTokens,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
} from '@groupi/shared/design/themes';
import type { BaseTheme } from '@groupi/shared/design/themes';

// Helper to format HSL values consistently
function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return String(value);
  }
  // Convert hsl(x, y%, z%) to hsl(x y% z%) format for CSS
  return value.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/g, 'hsl($1 $2% $3%)');
}

// Generate the @theme block to disable Tailwind defaults
function generateDefaultsDisabledBlock(): string {
  const lines: string[] = [];

  lines.push('@theme {');
  lines.push(
    '  /* ==========================================================================',
    '     DISABLE TAILWIND DEFAULTS - Only design tokens should be used',
    '     This prevents classes like bg-red-500, shadow-lg, etc. from working.',
    '     Use design tokens instead (bg-primary, shadow-raised, etc.)',
    '     ========================================================================== */'
  );
  lines.push('');
  lines.push('  /* Disable default color palette (red, blue, green, etc.) */');
  lines.push('  --color-red-*: initial;');
  lines.push('  --color-orange-*: initial;');
  lines.push('  --color-amber-*: initial;');
  lines.push('  --color-yellow-*: initial;');
  lines.push('  --color-lime-*: initial;');
  lines.push('  --color-green-*: initial;');
  lines.push('  --color-emerald-*: initial;');
  lines.push('  --color-teal-*: initial;');
  lines.push('  --color-cyan-*: initial;');
  lines.push('  --color-sky-*: initial;');
  lines.push('  --color-blue-*: initial;');
  lines.push('  --color-indigo-*: initial;');
  lines.push('  --color-violet-*: initial;');
  lines.push('  --color-purple-*: initial;');
  lines.push('  --color-fuchsia-*: initial;');
  lines.push('  --color-pink-*: initial;');
  lines.push('  --color-rose-*: initial;');
  lines.push('  --color-slate-*: initial;');
  lines.push('  --color-gray-*: initial;');
  lines.push('  --color-zinc-*: initial;');
  lines.push('  --color-neutral-*: initial;');
  lines.push('  --color-stone-*: initial;');
  lines.push('');
  lines.push(
    '  /* Disable default shadows (use shadow-raised, shadow-floating, etc.) */'
  );
  lines.push('  --shadow-xs: initial;');
  lines.push('  --shadow-sm: initial;');
  lines.push('  --shadow: initial;');
  lines.push('  --shadow-md: initial;');
  lines.push('  --shadow-lg: initial;');
  lines.push('  --shadow-xl: initial;');
  lines.push('  --shadow-2xl: initial;');
  lines.push('  --shadow-inner: initial;');
  lines.push('  --shadow-none: initial;');
  lines.push('');
  lines.push(
    '  /* Disable default border radius (use radius-button, radius-card, etc.) */'
  );
  lines.push('  --radius-none: initial;');
  lines.push('  --radius-xs: initial;');
  lines.push('  --radius-full: initial;');
  lines.push('  --radius-xl: initial;');
  lines.push('  --radius-2xl: initial;');
  lines.push('  --radius-3xl: initial;');
  lines.push('  --radius-4xl: initial;');
  lines.push('');
  lines.push('  /* Disable default z-index (use z-modal, z-popover, etc.) */');
  lines.push('  --z-index-0: initial;');
  lines.push('  --z-index-10: initial;');
  lines.push('  --z-index-20: initial;');
  lines.push('  --z-index-30: initial;');
  lines.push('  --z-index-40: initial;');
  lines.push('  --z-index-50: initial;');
  lines.push('');
  lines.push('  /* Keep: black, white, transparent, current, inherit */');
  lines.push('}');

  return lines.join('\n');
}

// Generate the @theme inline block for Tailwind v4
function generateThemeBlock(): string {
  const lines: string[] = [];

  lines.push('@theme inline {');
  lines.push(
    '  /* ==========================================================================',
    '     AUTO-GENERATED FROM @groupi/shared/design/themes',
    '     Do not edit directly. Run: pnpm generate:tokens',
    '     ========================================================================== */'
  );
  lines.push('');

  // Legacy color mappings (reference CSS vars)
  lines.push('  /* Legacy color tokens (for shadcn/ui compatibility) */');
  lines.push('  --color-border: var(--border);');
  lines.push('  --color-border2: var(--border2);');
  lines.push('  --color-input: var(--input);');
  lines.push('  --color-ring: var(--ring);');
  lines.push('  --color-background: var(--background);');
  lines.push('  --color-foreground: var(--foreground);');
  lines.push('  --color-primary: var(--primary);');
  lines.push('  --color-primary-foreground: var(--primary-foreground);');
  lines.push('  --color-secondary: var(--secondary);');
  lines.push('  --color-secondary-foreground: var(--secondary-foreground);');
  lines.push('  --color-destructive: var(--destructive);');
  lines.push(
    '  --color-destructive-foreground: var(--destructive-foreground);'
  );
  lines.push('  --color-muted: var(--muted);');
  lines.push('  --color-muted-foreground: var(--muted-foreground);');
  lines.push('  --color-accent: var(--accent);');
  lines.push('  --color-accent-foreground: var(--accent-foreground);');
  lines.push('  --color-accent2: var(--accent2);');
  lines.push('  --color-accent2-foreground: var(--accent-foreground2);');
  lines.push('  --color-popover: var(--popover);');
  lines.push('  --color-popover-foreground: var(--popover-foreground);');
  lines.push('  --color-card: var(--card);');
  lines.push('  --color-card-foreground: var(--card-foreground);');
  lines.push('');

  // Semantic color tokens
  lines.push('  /* Semantic color tokens */');
  lines.push('  --color-brand-primary: var(--brand-primary);');
  lines.push('  --color-brand-primary-hover: var(--brand-primary-hover);');
  lines.push('  --color-brand-primary-active: var(--brand-primary-active);');
  lines.push('  --color-brand-primary-subtle: var(--brand-primary-subtle);');
  lines.push('  --color-brand-secondary: var(--brand-secondary);');
  lines.push('  --color-brand-secondary-hover: var(--brand-secondary-hover);');
  lines.push('  --color-brand-accent: var(--brand-accent);');
  lines.push('  --color-brand-accent-hover: var(--brand-accent-hover);');
  lines.push('');

  // Status colors (generic - work with bg-, text-, border-)
  lines.push(
    '  /* Status colors (work with bg-success, text-success, etc.) */'
  );
  lines.push('  --color-success: var(--bg-success);');
  lines.push('  --color-warning: var(--bg-warning);');
  lines.push('  --color-error: var(--bg-error);');
  lines.push('  --color-info: var(--bg-info);');
  lines.push('');

  // Background colors
  lines.push('  /* Background colors */');
  lines.push('  --color-bg-page: var(--bg-page);');
  lines.push('  --color-bg-surface: var(--bg-surface);');
  lines.push('  --color-bg-elevated: var(--bg-elevated);');
  lines.push('  --color-bg-sunken: var(--bg-sunken);');
  lines.push('  --color-bg-overlay: var(--bg-overlay);');
  lines.push('  --color-bg-interactive: var(--bg-interactive);');
  lines.push('  --color-bg-interactive-hover: var(--bg-interactive-hover);');
  lines.push('  --color-bg-success: var(--bg-success);');
  lines.push('  --color-bg-success-subtle: var(--bg-success-subtle);');
  lines.push('  --color-bg-warning: var(--bg-warning);');
  lines.push('  --color-bg-warning-subtle: var(--bg-warning-subtle);');
  lines.push('  --color-bg-error: var(--bg-error);');
  lines.push('  --color-bg-error-subtle: var(--bg-error-subtle);');
  lines.push('  --color-bg-info: var(--bg-info);');
  lines.push('  --color-bg-info-subtle: var(--bg-info-subtle);');
  lines.push('');

  // Text colors
  lines.push('  /* Text colors */');
  lines.push('  --color-text-primary: var(--text-primary);');
  lines.push('  --color-text-secondary: var(--text-secondary);');
  lines.push('  --color-text-tertiary: var(--text-tertiary);');
  lines.push('  --color-text-muted: var(--text-muted);');
  lines.push('  --color-text-disabled: var(--text-disabled);');
  lines.push('  --color-text-heading: var(--text-heading);');
  lines.push('  --color-text-body: var(--text-body);');
  lines.push('  --color-text-caption: var(--text-caption);');
  lines.push('  --color-text-on-primary: var(--text-on-primary);');
  lines.push('  --color-text-on-surface: var(--text-on-surface);');
  lines.push('  --color-text-on-error: var(--text-on-error);');
  lines.push('  --color-text-link: var(--text-link);');
  lines.push('  --color-text-link-hover: var(--text-link-hover);');
  lines.push('  --color-text-success: var(--text-success);');
  lines.push('  --color-text-warning: var(--text-warning);');
  lines.push('  --color-text-error: var(--text-error);');
  lines.push('');

  // Border colors
  lines.push('  /* Border colors */');
  lines.push('  --color-border-default: var(--border-default);');
  lines.push('  --color-border-strong: var(--border-strong);');
  lines.push('  --color-border-subtle: var(--border-subtle);');
  lines.push('  --color-border-focus: var(--border-focus);');
  lines.push('  --color-border-error: var(--border-error);');
  lines.push('  --color-border-success: var(--border-success);');
  lines.push('');

  // State colors
  lines.push('  /* State colors */');
  lines.push('  --color-state-focus-ring: var(--state-focus-ring);');
  lines.push('  --color-state-selection: var(--state-selection);');
  lines.push('  --color-state-highlight: var(--state-highlight);');
  lines.push('');

  // Fun colors
  lines.push('  /* Fun/celebration colors */');
  lines.push('  --color-fun-celebration: var(--fun-celebration);');
  lines.push('  --color-fun-achievement: var(--fun-achievement);');
  lines.push('  --color-fun-streak: var(--fun-streak);');
  lines.push('  --color-fun-party: var(--fun-party);');
  lines.push('');

  // Radius tokens from shared
  lines.push('  /* Radius tokens */');
  lines.push('  --radius-lg: var(--radius);');
  lines.push('  --radius-md: calc(var(--radius) - 2px);');
  lines.push('  --radius-sm: calc(var(--radius) - 4px);');
  lines.push(`  --radius-subtle: ${sharedTokens.radius.shape.subtle};`);
  lines.push(`  --radius-soft: ${sharedTokens.radius.shape.soft};`);
  lines.push(`  --radius-rounded: ${sharedTokens.radius.shape.rounded};`);
  lines.push(`  --radius-pill: ${sharedTokens.radius.shape.pill};`);
  lines.push(`  --radius-button: ${sharedTokens.radius.component.button};`);
  lines.push(`  --radius-card: ${sharedTokens.radius.component.card};`);
  lines.push(`  --radius-input: ${sharedTokens.radius.component.input};`);
  lines.push(`  --radius-badge: ${sharedTokens.radius.component.badge};`);
  lines.push(`  --radius-avatar: ${sharedTokens.radius.component.avatar};`);
  lines.push(`  --radius-modal: ${sharedTokens.radius.component.modal};`);
  lines.push(`  --radius-tooltip: ${sharedTokens.radius.component.tooltip};`);
  lines.push(`  --radius-dropdown: ${sharedTokens.radius.component.dropdown};`);
  lines.push(`  --radius-sheet: ${sharedTokens.radius.component.sheet};`);
  lines.push('');

  // Shadow tokens
  lines.push('  /* Shadow tokens */');
  lines.push('  --shadow-raised: var(--shadow-raised);');
  lines.push('  --shadow-floating: var(--shadow-floating);');
  lines.push('  --shadow-overlay: var(--shadow-overlay);');
  lines.push('  --shadow-popup: var(--shadow-popup);');
  lines.push('  --shadow-pop: var(--shadow-pop);');
  lines.push('  --shadow-glow: var(--shadow-glow);');
  lines.push('  --shadow-bounce: var(--shadow-bounce);');
  lines.push('');

  // Duration tokens
  lines.push('  /* Duration tokens */');
  lines.push(`  --duration-instant: ${sharedTokens.duration.instant};`);
  lines.push(`  --duration-micro: ${sharedTokens.duration.micro};`);
  lines.push(`  --duration-fast: ${sharedTokens.duration.fast};`);
  lines.push(`  --duration-normal: ${sharedTokens.duration.normal};`);
  lines.push(`  --duration-slow: ${sharedTokens.duration.slow};`);
  lines.push(`  --duration-slower: ${sharedTokens.duration.slower};`);
  lines.push('');

  // Easing tokens
  lines.push('  /* Easing tokens */');
  lines.push(`  --ease-default: ${sharedTokens.easing.default};`);
  lines.push(`  --ease-enter: ${sharedTokens.easing.enter};`);
  lines.push(`  --ease-exit: ${sharedTokens.easing.exit};`);
  lines.push(`  --ease-bounce: ${sharedTokens.easing.bounce};`);
  lines.push(`  --ease-spring: ${sharedTokens.easing.spring};`);
  lines.push('');

  // Z-index tokens (--z-index-* generates z-* utilities in Tailwind v4)
  lines.push('  /* Z-index tokens */');
  lines.push('  /* Local stacking (within components) */');
  lines.push(`  --z-index-lifted: ${sharedTokens.zIndex.lifted};`);
  lines.push(`  --z-index-float: ${sharedTokens.zIndex.float};`);
  lines.push(`  --z-index-top: ${sharedTokens.zIndex.top};`);
  lines.push('  /* Global stacking (overlays, fixed elements) */');
  lines.push(`  --z-index-base: ${sharedTokens.zIndex.base};`);
  lines.push(`  --z-index-sticky: ${sharedTokens.zIndex.sticky};`);
  lines.push(`  --z-index-dropdown: ${sharedTokens.zIndex.dropdown};`);
  lines.push(`  --z-index-popover: ${sharedTokens.zIndex.popover};`);
  lines.push(`  --z-index-modal: ${sharedTokens.zIndex.modal};`);
  lines.push(`  --z-index-toast: ${sharedTokens.zIndex.toast};`);
  lines.push(`  --z-index-tooltip: ${sharedTokens.zIndex.tooltip};`);
  lines.push(`  --z-index-overlay: ${sharedTokens.zIndex.overlay};`);
  lines.push('');

  // Typography
  lines.push('  /* Typography */');
  lines.push(
    '  --font-sans: var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;'
  );
  lines.push(
    '  --font-heading: var(--font-heading), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;'
  );
  lines.push(`  --font-mono: ${sharedTokens.typography.fontFamily.mono};`);
  lines.push('');

  // Animation tokens
  lines.push('  /* Animation tokens */');
  lines.push('  --animate-accordion-down: accordion-down 0.2s ease-out;');
  lines.push('  --animate-accordion-up: accordion-up 0.2s ease-out;');
  lines.push(
    `  --animate-bounce-in: bounce-in ${sharedTokens.duration.normal} ${sharedTokens.easing.bounce};`
  );
  lines.push(
    `  --animate-pop: pop ${sharedTokens.duration.fast} ${sharedTokens.easing.bounce};`
  );
  lines.push(
    `  --animate-wiggle: wiggle ${sharedTokens.duration.slow} ease-in-out;`
  );
  lines.push(
    `  --animate-fade-in: fade-in ${sharedTokens.duration.fast} ease-out;`
  );
  lines.push(
    `  --animate-slide-up: slide-up ${sharedTokens.duration.normal} ease-out;`
  );
  lines.push(
    `  --animate-scale-in: scale-in ${sharedTokens.duration.fast} ${sharedTokens.easing.bounce};`
  );

  lines.push('}');

  return lines.join('\n');
}

// Generate CSS variables for a theme
function generateThemeVars(theme: BaseTheme, selector: string): string {
  const tokens = theme.tokens;
  const lines: string[] = [];

  lines.push(`${selector} {`);
  lines.push(
    '  /* ==========================================================================',
    `     AUTO-GENERATED FROM @groupi/shared/design/themes/${theme.id}`,
    '     Do not edit directly. Run: pnpm generate:tokens',
    '     ========================================================================== */'
  );
  lines.push('');

  // Legacy tokens (shadcn/ui compatibility)
  lines.push('  /* Legacy tokens (shadcn/ui) */');
  lines.push(`  --background: ${formatValue(tokens.legacy.background)};`);
  lines.push(`  --foreground: ${formatValue(tokens.legacy.foreground)};`);
  lines.push(`  --muted: ${formatValue(tokens.legacy.muted)};`);
  lines.push(
    `  --muted-foreground: ${formatValue(tokens.legacy.mutedForeground)};`
  );
  lines.push(`  --popover: ${formatValue(tokens.legacy.popover)};`);
  lines.push(
    `  --popover-foreground: ${formatValue(tokens.legacy.popoverForeground)};`
  );
  lines.push(`  --card: ${formatValue(tokens.legacy.card)};`);
  lines.push(
    `  --card-foreground: ${formatValue(tokens.legacy.cardForeground)};`
  );
  lines.push(`  --border: ${formatValue(tokens.legacy.border)};`);
  lines.push('  --border2: var(--border);');
  lines.push(`  --input: ${formatValue(tokens.legacy.input)};`);
  lines.push(`  --primary: ${formatValue(tokens.legacy.primary)};`);
  lines.push(
    `  --primary-foreground: ${formatValue(tokens.legacy.primaryForeground)};`
  );
  lines.push(`  --secondary: ${formatValue(tokens.legacy.secondary)};`);
  lines.push(
    `  --secondary-foreground: ${formatValue(tokens.legacy.secondaryForeground)};`
  );
  lines.push(`  --accent: ${formatValue(tokens.legacy.accent)};`);
  lines.push(
    `  --accent-foreground: ${formatValue(tokens.legacy.accentForeground)};`
  );
  lines.push('  --accent2: var(--accent);');
  lines.push('  --accent-foreground2: var(--accent-foreground);');
  lines.push(`  --destructive: ${formatValue(tokens.legacy.destructive)};`);
  lines.push(
    `  --destructive-foreground: ${formatValue(tokens.legacy.destructiveForeground)};`
  );
  lines.push(`  --ring: ${formatValue(tokens.legacy.ring)};`);
  lines.push(`  --radius: ${formatValue(tokens.legacy.radius)};`);
  lines.push('');

  // Brand colors
  lines.push('  /* Brand colors */');
  lines.push(`  --brand-primary: ${formatValue(tokens.brand.primary)};`);
  lines.push(
    `  --brand-primary-hover: ${formatValue(tokens.brand.primaryHover)};`
  );
  lines.push(
    `  --brand-primary-active: ${formatValue(tokens.brand.primaryActive)};`
  );
  lines.push(
    `  --brand-primary-subtle: ${formatValue(tokens.brand.primarySubtle)};`
  );
  lines.push(`  --brand-secondary: ${formatValue(tokens.brand.secondary)};`);
  lines.push(
    `  --brand-secondary-hover: ${formatValue(tokens.brand.secondaryHover)};`
  );
  lines.push(`  --brand-accent: ${formatValue(tokens.brand.accent)};`);
  lines.push(
    `  --brand-accent-hover: ${formatValue(tokens.brand.accentHover)};`
  );
  lines.push('');

  // Background colors
  lines.push('  /* Background colors */');
  lines.push(`  --bg-page: ${formatValue(tokens.background.page)};`);
  lines.push(`  --bg-surface: ${formatValue(tokens.background.surface)};`);
  lines.push(`  --bg-elevated: ${formatValue(tokens.background.elevated)};`);
  lines.push(`  --bg-sunken: ${formatValue(tokens.background.sunken)};`);
  lines.push(`  --bg-overlay: ${formatValue(tokens.background.overlay)};`);
  lines.push(
    `  --bg-interactive: ${formatValue(tokens.background.interactive)};`
  );
  lines.push(
    `  --bg-interactive-hover: ${formatValue(tokens.background.interactiveHover)};`
  );
  lines.push(
    `  --bg-interactive-active: ${formatValue(tokens.background.interactiveActive)};`
  );
  lines.push(`  --bg-success: ${formatValue(tokens.background.success)};`);
  lines.push(
    `  --bg-success-subtle: ${formatValue(tokens.background.successSubtle)};`
  );
  lines.push(`  --bg-warning: ${formatValue(tokens.background.warning)};`);
  lines.push(
    `  --bg-warning-subtle: ${formatValue(tokens.background.warningSubtle)};`
  );
  lines.push(`  --bg-error: ${formatValue(tokens.background.error)};`);
  lines.push(
    `  --bg-error-subtle: ${formatValue(tokens.background.errorSubtle)};`
  );
  lines.push(`  --bg-info: ${formatValue(tokens.background.info)};`);
  lines.push(
    `  --bg-info-subtle: ${formatValue(tokens.background.infoSubtle)};`
  );
  lines.push('');

  // Text colors
  lines.push('  /* Text colors */');
  lines.push(`  --text-primary: ${formatValue(tokens.text.primary)};`);
  lines.push(`  --text-secondary: ${formatValue(tokens.text.secondary)};`);
  lines.push(`  --text-tertiary: ${formatValue(tokens.text.tertiary)};`);
  lines.push(`  --text-muted: ${formatValue(tokens.text.muted)};`);
  lines.push(`  --text-disabled: ${formatValue(tokens.text.disabled)};`);
  lines.push(`  --text-heading: ${formatValue(tokens.text.heading)};`);
  lines.push(`  --text-body: ${formatValue(tokens.text.body)};`);
  lines.push(`  --text-caption: ${formatValue(tokens.text.caption)};`);
  lines.push(`  --text-on-primary: ${formatValue(tokens.text.onPrimary)};`);
  lines.push(`  --text-on-surface: ${formatValue(tokens.text.onSurface)};`);
  lines.push(`  --text-on-error: ${formatValue(tokens.text.onError)};`);
  lines.push(`  --text-link: ${formatValue(tokens.text.link)};`);
  lines.push(`  --text-link-hover: ${formatValue(tokens.text.linkHover)};`);
  lines.push(`  --text-success: ${formatValue(tokens.text.success)};`);
  lines.push(`  --text-warning: ${formatValue(tokens.text.warning)};`);
  lines.push(`  --text-error: ${formatValue(tokens.text.error)};`);
  lines.push('');

  // Border colors
  lines.push('  /* Border colors */');
  lines.push(`  --border-default: ${formatValue(tokens.border.default)};`);
  lines.push(`  --border-strong: ${formatValue(tokens.border.strong)};`);
  lines.push(`  --border-subtle: ${formatValue(tokens.border.subtle)};`);
  lines.push(`  --border-focus: ${formatValue(tokens.border.focus)};`);
  lines.push(`  --border-error: ${formatValue(tokens.border.error)};`);
  lines.push(`  --border-success: ${formatValue(tokens.border.success)};`);
  lines.push('');

  // State colors
  lines.push('  /* State colors */');
  lines.push(`  --state-focus-ring: ${formatValue(tokens.state.focusRing)};`);
  lines.push(`  --state-selection: ${formatValue(tokens.state.selection)};`);
  lines.push(`  --state-highlight: ${formatValue(tokens.state.highlight)};`);
  lines.push('');

  // Fun colors
  lines.push('  /* Fun/celebration colors */');
  lines.push(`  --fun-celebration: ${formatValue(tokens.fun.celebration)};`);
  lines.push(`  --fun-achievement: ${formatValue(tokens.fun.achievement)};`);
  lines.push(`  --fun-streak: ${formatValue(tokens.fun.streak)};`);
  lines.push(`  --fun-party: ${formatValue(tokens.fun.party)};`);
  lines.push('');

  // Shadow tokens
  lines.push(
    `  /* Shadow tokens${theme.mode === 'dark' ? ' (dark mode)' : ''} */`
  );
  lines.push(`  --shadow-raised: ${tokens.shadow.raised};`);
  lines.push(`  --shadow-floating: ${tokens.shadow.floating};`);
  lines.push(`  --shadow-overlay: ${tokens.shadow.overlay};`);
  lines.push(`  --shadow-popup: ${tokens.shadow.popup};`);
  lines.push(`  --shadow-pop: ${tokens.shadow.pop};`);
  lines.push(`  --shadow-glow: ${tokens.shadow.glow};`);
  lines.push(`  --shadow-bounce: ${tokens.shadow.bounce};`);

  lines.push('}');

  return lines.join('\n');
}

// Generate dark mode indicator for shadcn/ui
function generateDarkModeIndicators(): string {
  const darkThemes = baseThemes.filter(t => t.mode === 'dark');
  const selectors = darkThemes.map(t => `.theme-${t.id}`).join(',\n');

  return `/* Dark mode indicator for shadcn/ui compatibility */
${selectors},
.dark {
  color-scheme: dark;
}`;
}

// Main function
function main() {
  const outputPath = path.join(__dirname, '../styles/_generated-tokens.css');

  // Find default themes
  const defaultLightTheme = baseThemes.find(
    t => t.id === DEFAULT_LIGHT_THEME_ID
  );
  const defaultDarkTheme = baseThemes.find(t => t.id === DEFAULT_DARK_THEME_ID);

  if (!defaultLightTheme || !defaultDarkTheme) {
    console.error('Error: Default themes not found');
    process.exit(1);
  }

  // Generate CSS blocks
  const blocks: string[] = [
    `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * This file is generated from @groupi/shared/design/themes
 * Run: pnpm generate:tokens
 *
 * Available themes:
 * - :root (default: ${DEFAULT_LIGHT_THEME_ID})
 * - .dark (legacy: ${DEFAULT_DARK_THEME_ID})
${baseThemes.map(t => ` * - .theme-${t.id}`).join('\n')}
 */`,
  ];

  // Add defaults disabled block
  blocks.push(generateDefaultsDisabledBlock());

  // Add @theme inline block
  blocks.push(generateThemeBlock());

  // Add :root (default light theme)
  blocks.push(generateThemeVars(defaultLightTheme, ':root'));

  // Add .dark (legacy dark theme support)
  blocks.push(generateThemeVars(defaultDarkTheme, '.dark'));

  // Add each theme with its class selector
  for (const theme of baseThemes) {
    blocks.push(generateThemeVars(theme, `.theme-${theme.id}`));
  }

  // Add dark mode indicators
  blocks.push(generateDarkModeIndicators());

  const content = blocks.join('\n\n');

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated tokens at ${outputPath}`);
  console.log(`  Themes: ${baseThemes.map(t => t.id).join(', ')}`);
}

main();
