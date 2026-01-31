/**
 * Token Generation Script
 *
 * Reads design tokens from @groupi/shared and generates CSS custom properties.
 * This ensures the TypeScript token files are the single source of truth.
 *
 * Usage: npx tsx scripts/generate-tokens.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  groupiDark,
  groupiLight,
  sharedTokens,
} from '@groupi/shared/design/themes';

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

// Generate :root CSS variables from light theme
function generateRootVars(): string {
  const lines: string[] = [];

  lines.push(':root {');
  lines.push(
    '  /* ==========================================================================',
    '     AUTO-GENERATED FROM @groupi/shared/design/themes/groupi-light',
    '     Do not edit directly. Run: pnpm generate:tokens',
    '     ========================================================================== */'
  );
  lines.push('');

  // Legacy tokens (shadcn/ui compatibility)
  lines.push('  /* Legacy tokens (shadcn/ui) */');
  lines.push(`  --background: ${formatValue(groupiLight.legacy.background)};`);
  lines.push(`  --foreground: ${formatValue(groupiLight.legacy.foreground)};`);
  lines.push(`  --muted: ${formatValue(groupiLight.legacy.muted)};`);
  lines.push(
    `  --muted-foreground: ${formatValue(groupiLight.legacy.mutedForeground)};`
  );
  lines.push(`  --popover: ${formatValue(groupiLight.legacy.popover)};`);
  lines.push(
    `  --popover-foreground: ${formatValue(groupiLight.legacy.popoverForeground)};`
  );
  lines.push(`  --card: ${formatValue(groupiLight.legacy.card)};`);
  lines.push(
    `  --card-foreground: ${formatValue(groupiLight.legacy.cardForeground)};`
  );
  lines.push(`  --border: ${formatValue(groupiLight.legacy.border)};`);
  lines.push('  --border2: var(--border);');
  lines.push(`  --input: ${formatValue(groupiLight.legacy.input)};`);
  lines.push(`  --primary: ${formatValue(groupiLight.legacy.primary)};`);
  lines.push(
    `  --primary-foreground: ${formatValue(groupiLight.legacy.primaryForeground)};`
  );
  lines.push(`  --secondary: ${formatValue(groupiLight.legacy.secondary)};`);
  lines.push(
    `  --secondary-foreground: ${formatValue(groupiLight.legacy.secondaryForeground)};`
  );
  lines.push(`  --accent: ${formatValue(groupiLight.legacy.accent)};`);
  lines.push(
    `  --accent-foreground: ${formatValue(groupiLight.legacy.accentForeground)};`
  );
  lines.push('  --accent2: var(--accent);');
  lines.push('  --accent-foreground2: var(--accent-foreground);');
  lines.push(
    `  --destructive: ${formatValue(groupiLight.legacy.destructive)};`
  );
  lines.push(
    `  --destructive-foreground: ${formatValue(groupiLight.legacy.destructiveForeground)};`
  );
  lines.push(`  --ring: ${formatValue(groupiLight.legacy.ring)};`);
  lines.push(`  --radius: ${formatValue(groupiLight.legacy.radius)};`);
  lines.push('');

  // Brand colors
  lines.push('  /* Brand colors */');
  lines.push(`  --brand-primary: ${formatValue(groupiLight.brand.primary)};`);
  lines.push(
    `  --brand-primary-hover: ${formatValue(groupiLight.brand.primaryHover)};`
  );
  lines.push(
    `  --brand-primary-active: ${formatValue(groupiLight.brand.primaryActive)};`
  );
  lines.push(
    `  --brand-primary-subtle: ${formatValue(groupiLight.brand.primarySubtle)};`
  );
  lines.push(
    `  --brand-secondary: ${formatValue(groupiLight.brand.secondary)};`
  );
  lines.push(
    `  --brand-secondary-hover: ${formatValue(groupiLight.brand.secondaryHover)};`
  );
  lines.push(`  --brand-accent: ${formatValue(groupiLight.brand.accent)};`);
  lines.push(
    `  --brand-accent-hover: ${formatValue(groupiLight.brand.accentHover)};`
  );
  lines.push('');

  // Background colors
  lines.push('  /* Background colors */');
  lines.push(`  --bg-page: ${formatValue(groupiLight.background.page)};`);
  lines.push(`  --bg-surface: ${formatValue(groupiLight.background.surface)};`);
  lines.push(
    `  --bg-elevated: ${formatValue(groupiLight.background.elevated)};`
  );
  lines.push(`  --bg-sunken: ${formatValue(groupiLight.background.sunken)};`);
  lines.push(`  --bg-overlay: ${formatValue(groupiLight.background.overlay)};`);
  lines.push(
    `  --bg-interactive: ${formatValue(groupiLight.background.interactive)};`
  );
  lines.push(
    `  --bg-interactive-hover: ${formatValue(groupiLight.background.interactiveHover)};`
  );
  lines.push(
    `  --bg-interactive-active: ${formatValue(groupiLight.background.interactiveActive)};`
  );
  lines.push(`  --bg-success: ${formatValue(groupiLight.background.success)};`);
  lines.push(
    `  --bg-success-subtle: ${formatValue(groupiLight.background.successSubtle)};`
  );
  lines.push(`  --bg-warning: ${formatValue(groupiLight.background.warning)};`);
  lines.push(
    `  --bg-warning-subtle: ${formatValue(groupiLight.background.warningSubtle)};`
  );
  lines.push(`  --bg-error: ${formatValue(groupiLight.background.error)};`);
  lines.push(
    `  --bg-error-subtle: ${formatValue(groupiLight.background.errorSubtle)};`
  );
  lines.push(`  --bg-info: ${formatValue(groupiLight.background.info)};`);
  lines.push(
    `  --bg-info-subtle: ${formatValue(groupiLight.background.infoSubtle)};`
  );
  lines.push('');

  // Text colors
  lines.push('  /* Text colors */');
  lines.push(`  --text-primary: ${formatValue(groupiLight.text.primary)};`);
  lines.push(`  --text-secondary: ${formatValue(groupiLight.text.secondary)};`);
  lines.push(`  --text-tertiary: ${formatValue(groupiLight.text.tertiary)};`);
  lines.push(`  --text-muted: ${formatValue(groupiLight.text.muted)};`);
  lines.push(`  --text-disabled: ${formatValue(groupiLight.text.disabled)};`);
  lines.push(`  --text-heading: ${formatValue(groupiLight.text.heading)};`);
  lines.push(`  --text-body: ${formatValue(groupiLight.text.body)};`);
  lines.push(`  --text-caption: ${formatValue(groupiLight.text.caption)};`);
  lines.push(
    `  --text-on-primary: ${formatValue(groupiLight.text.onPrimary)};`
  );
  lines.push(
    `  --text-on-surface: ${formatValue(groupiLight.text.onSurface)};`
  );
  lines.push(`  --text-on-error: ${formatValue(groupiLight.text.onError)};`);
  lines.push(`  --text-link: ${formatValue(groupiLight.text.link)};`);
  lines.push(
    `  --text-link-hover: ${formatValue(groupiLight.text.linkHover)};`
  );
  lines.push(`  --text-success: ${formatValue(groupiLight.text.success)};`);
  lines.push(`  --text-warning: ${formatValue(groupiLight.text.warning)};`);
  lines.push(`  --text-error: ${formatValue(groupiLight.text.error)};`);
  lines.push('');

  // Border colors
  lines.push('  /* Border colors */');
  lines.push(`  --border-default: ${formatValue(groupiLight.border.default)};`);
  lines.push(`  --border-strong: ${formatValue(groupiLight.border.strong)};`);
  lines.push(`  --border-subtle: ${formatValue(groupiLight.border.subtle)};`);
  lines.push(`  --border-focus: ${formatValue(groupiLight.border.focus)};`);
  lines.push(`  --border-error: ${formatValue(groupiLight.border.error)};`);
  lines.push(`  --border-success: ${formatValue(groupiLight.border.success)};`);
  lines.push('');

  // State colors
  lines.push('  /* State colors */');
  lines.push(
    `  --state-focus-ring: ${formatValue(groupiLight.state.focusRing)};`
  );
  lines.push(
    `  --state-selection: ${formatValue(groupiLight.state.selection)};`
  );
  lines.push(
    `  --state-highlight: ${formatValue(groupiLight.state.highlight)};`
  );
  lines.push('');

  // Fun colors
  lines.push('  /* Fun/celebration colors */');
  lines.push(
    `  --fun-celebration: ${formatValue(groupiLight.fun.celebration)};`
  );
  lines.push(
    `  --fun-achievement: ${formatValue(groupiLight.fun.achievement)};`
  );
  lines.push(`  --fun-streak: ${formatValue(groupiLight.fun.streak)};`);
  lines.push(`  --fun-party: ${formatValue(groupiLight.fun.party)};`);
  lines.push('');

  // Shadow tokens
  lines.push('  /* Shadow tokens */');
  lines.push(`  --shadow-raised: ${groupiLight.shadow.raised};`);
  lines.push(`  --shadow-floating: ${groupiLight.shadow.floating};`);
  lines.push(`  --shadow-overlay: ${groupiLight.shadow.overlay};`);
  lines.push(`  --shadow-popup: ${groupiLight.shadow.popup};`);
  lines.push(`  --shadow-pop: ${groupiLight.shadow.pop};`);
  lines.push(`  --shadow-glow: ${groupiLight.shadow.glow};`);
  lines.push(`  --shadow-bounce: ${groupiLight.shadow.bounce};`);

  lines.push('}');

  return lines.join('\n');
}

// Generate .dark CSS variables from dark theme
function generateDarkVars(): string {
  const lines: string[] = [];

  lines.push('.dark {');
  lines.push(
    '  /* ==========================================================================',
    '     AUTO-GENERATED FROM @groupi/shared/design/themes/groupi-dark',
    '     Do not edit directly. Run: pnpm generate:tokens',
    '     ========================================================================== */'
  );
  lines.push('');

  // Legacy tokens (shadcn/ui compatibility)
  lines.push('  /* Legacy tokens (shadcn/ui) */');
  lines.push(`  --background: ${formatValue(groupiDark.legacy.background)};`);
  lines.push(`  --foreground: ${formatValue(groupiDark.legacy.foreground)};`);
  lines.push(`  --muted: ${formatValue(groupiDark.legacy.muted)};`);
  lines.push(
    `  --muted-foreground: ${formatValue(groupiDark.legacy.mutedForeground)};`
  );
  lines.push(`  --popover: ${formatValue(groupiDark.legacy.popover)};`);
  lines.push(
    `  --popover-foreground: ${formatValue(groupiDark.legacy.popoverForeground)};`
  );
  lines.push(`  --card: ${formatValue(groupiDark.legacy.card)};`);
  lines.push(
    `  --card-foreground: ${formatValue(groupiDark.legacy.cardForeground)};`
  );
  lines.push(`  --border: ${formatValue(groupiDark.legacy.border)};`);
  lines.push('  --border2: var(--border);');
  lines.push(`  --input: ${formatValue(groupiDark.legacy.input)};`);
  lines.push(`  --primary: ${formatValue(groupiDark.legacy.primary)};`);
  lines.push(
    `  --primary-foreground: ${formatValue(groupiDark.legacy.primaryForeground)};`
  );
  lines.push(`  --secondary: ${formatValue(groupiDark.legacy.secondary)};`);
  lines.push(
    `  --secondary-foreground: ${formatValue(groupiDark.legacy.secondaryForeground)};`
  );
  lines.push(`  --accent: ${formatValue(groupiDark.legacy.accent)};`);
  lines.push(
    `  --accent-foreground: ${formatValue(groupiDark.legacy.accentForeground)};`
  );
  lines.push('  --accent2: var(--accent);');
  lines.push('  --accent-foreground2: var(--accent-foreground);');
  lines.push(`  --destructive: ${formatValue(groupiDark.legacy.destructive)};`);
  lines.push(
    `  --destructive-foreground: ${formatValue(groupiDark.legacy.destructiveForeground)};`
  );
  lines.push(`  --ring: ${formatValue(groupiDark.legacy.ring)};`);
  lines.push(`  --radius: ${formatValue(groupiDark.legacy.radius)};`);
  lines.push('');

  // Brand colors
  lines.push('  /* Brand colors */');
  lines.push(`  --brand-primary: ${formatValue(groupiDark.brand.primary)};`);
  lines.push(
    `  --brand-primary-hover: ${formatValue(groupiDark.brand.primaryHover)};`
  );
  lines.push(
    `  --brand-primary-active: ${formatValue(groupiDark.brand.primaryActive)};`
  );
  lines.push(
    `  --brand-primary-subtle: ${formatValue(groupiDark.brand.primarySubtle)};`
  );
  lines.push(
    `  --brand-secondary: ${formatValue(groupiDark.brand.secondary)};`
  );
  lines.push(
    `  --brand-secondary-hover: ${formatValue(groupiDark.brand.secondaryHover)};`
  );
  lines.push(`  --brand-accent: ${formatValue(groupiDark.brand.accent)};`);
  lines.push(
    `  --brand-accent-hover: ${formatValue(groupiDark.brand.accentHover)};`
  );
  lines.push('');

  // Background colors
  lines.push('  /* Background colors */');
  lines.push(`  --bg-page: ${formatValue(groupiDark.background.page)};`);
  lines.push(`  --bg-surface: ${formatValue(groupiDark.background.surface)};`);
  lines.push(
    `  --bg-elevated: ${formatValue(groupiDark.background.elevated)};`
  );
  lines.push(`  --bg-sunken: ${formatValue(groupiDark.background.sunken)};`);
  lines.push(`  --bg-overlay: ${formatValue(groupiDark.background.overlay)};`);
  lines.push(
    `  --bg-interactive: ${formatValue(groupiDark.background.interactive)};`
  );
  lines.push(
    `  --bg-interactive-hover: ${formatValue(groupiDark.background.interactiveHover)};`
  );
  lines.push(
    `  --bg-interactive-active: ${formatValue(groupiDark.background.interactiveActive)};`
  );
  lines.push(`  --bg-success: ${formatValue(groupiDark.background.success)};`);
  lines.push(
    `  --bg-success-subtle: ${formatValue(groupiDark.background.successSubtle)};`
  );
  lines.push(`  --bg-warning: ${formatValue(groupiDark.background.warning)};`);
  lines.push(
    `  --bg-warning-subtle: ${formatValue(groupiDark.background.warningSubtle)};`
  );
  lines.push(`  --bg-error: ${formatValue(groupiDark.background.error)};`);
  lines.push(
    `  --bg-error-subtle: ${formatValue(groupiDark.background.errorSubtle)};`
  );
  lines.push(`  --bg-info: ${formatValue(groupiDark.background.info)};`);
  lines.push(
    `  --bg-info-subtle: ${formatValue(groupiDark.background.infoSubtle)};`
  );
  lines.push('');

  // Text colors
  lines.push('  /* Text colors */');
  lines.push(`  --text-primary: ${formatValue(groupiDark.text.primary)};`);
  lines.push(`  --text-secondary: ${formatValue(groupiDark.text.secondary)};`);
  lines.push(`  --text-tertiary: ${formatValue(groupiDark.text.tertiary)};`);
  lines.push(`  --text-muted: ${formatValue(groupiDark.text.muted)};`);
  lines.push(`  --text-disabled: ${formatValue(groupiDark.text.disabled)};`);
  lines.push(`  --text-heading: ${formatValue(groupiDark.text.heading)};`);
  lines.push(`  --text-body: ${formatValue(groupiDark.text.body)};`);
  lines.push(`  --text-caption: ${formatValue(groupiDark.text.caption)};`);
  lines.push(`  --text-on-primary: ${formatValue(groupiDark.text.onPrimary)};`);
  lines.push(`  --text-on-surface: ${formatValue(groupiDark.text.onSurface)};`);
  lines.push(`  --text-on-error: ${formatValue(groupiDark.text.onError)};`);
  lines.push(`  --text-link: ${formatValue(groupiDark.text.link)};`);
  lines.push(`  --text-link-hover: ${formatValue(groupiDark.text.linkHover)};`);
  lines.push(`  --text-success: ${formatValue(groupiDark.text.success)};`);
  lines.push(`  --text-warning: ${formatValue(groupiDark.text.warning)};`);
  lines.push(`  --text-error: ${formatValue(groupiDark.text.error)};`);
  lines.push('');

  // Border colors
  lines.push('  /* Border colors */');
  lines.push(`  --border-default: ${formatValue(groupiDark.border.default)};`);
  lines.push(`  --border-strong: ${formatValue(groupiDark.border.strong)};`);
  lines.push(`  --border-subtle: ${formatValue(groupiDark.border.subtle)};`);
  lines.push(`  --border-focus: ${formatValue(groupiDark.border.focus)};`);
  lines.push(`  --border-error: ${formatValue(groupiDark.border.error)};`);
  lines.push(`  --border-success: ${formatValue(groupiDark.border.success)};`);
  lines.push('');

  // State colors
  lines.push('  /* State colors */');
  lines.push(
    `  --state-focus-ring: ${formatValue(groupiDark.state.focusRing)};`
  );
  lines.push(
    `  --state-selection: ${formatValue(groupiDark.state.selection)};`
  );
  lines.push(
    `  --state-highlight: ${formatValue(groupiDark.state.highlight)};`
  );
  lines.push('');

  // Fun colors
  lines.push('  /* Fun/celebration colors */');
  lines.push(
    `  --fun-celebration: ${formatValue(groupiDark.fun.celebration)};`
  );
  lines.push(
    `  --fun-achievement: ${formatValue(groupiDark.fun.achievement)};`
  );
  lines.push(`  --fun-streak: ${formatValue(groupiDark.fun.streak)};`);
  lines.push(`  --fun-party: ${formatValue(groupiDark.fun.party)};`);
  lines.push('');

  // Shadow tokens (dark mode)
  lines.push('  /* Shadow tokens (dark mode) */');
  lines.push(`  --shadow-raised: ${groupiDark.shadow.raised};`);
  lines.push(`  --shadow-floating: ${groupiDark.shadow.floating};`);
  lines.push(`  --shadow-overlay: ${groupiDark.shadow.overlay};`);
  lines.push(`  --shadow-popup: ${groupiDark.shadow.popup};`);
  lines.push(`  --shadow-pop: ${groupiDark.shadow.pop};`);
  lines.push(`  --shadow-glow: ${groupiDark.shadow.glow};`);
  lines.push(`  --shadow-bounce: ${groupiDark.shadow.bounce};`);

  lines.push('}');

  return lines.join('\n');
}

// Main function
function main() {
  const outputPath = path.join(__dirname, '../styles/_generated-tokens.css');

  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * This file is generated from @groupi/shared/design/themes
 * Run: pnpm generate:tokens
 */

${generateDefaultsDisabledBlock()}

${generateThemeBlock()}

${generateRootVars()}

${generateDarkVars()}
`;

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated tokens at ${outputPath}`);
}

main();
