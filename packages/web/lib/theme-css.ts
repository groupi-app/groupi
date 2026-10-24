import type {
  BaseTheme,
  ThemeTokenOverrides,
} from '@groupi/shared/design/themes';
import { getThemePresentationVariables } from './theme-presentation';

/**
 * Format HSL values consistently for CSS
 */
function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return String(value);
  }
  // Convert hsl(x, y%, z%) to hsl(x y% z%) format for CSS
  return value.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/g, 'hsl($1 $2% $3%)');
}

/**
 * Generate complete CSS for a custom theme by merging base theme tokens
 * with custom overrides. Creates a standalone theme class.
 */
export function generateCompleteCustomThemeCSS(
  customThemeId: string,
  baseTheme: BaseTheme,
  overrides: ThemeTokenOverrides
): string {
  const tokens = baseTheme.tokens;
  const lines: string[] = [];
  // Use html.class selector for higher specificity than :root
  // :root has specificity (0,1,0), html.class has (0,1,1)
  // This ensures custom theme variables always override default :root styles
  const selector = `html.theme-custom-${customThemeId}`;

  lines.push(`${selector} {`);

  // Legacy tokens (shadcn/ui compatibility)
  lines.push('  /* Legacy tokens (shadcn/ui) */');
  lines.push(
    `  --background: ${formatValue(overrides.background?.page ?? tokens.legacy.background)};`
  );
  lines.push(
    `  --foreground: ${formatValue(overrides.text?.primary ?? tokens.legacy.foreground)};`
  );
  lines.push(
    `  --muted: ${formatValue(overrides.background?.sunken ?? tokens.legacy.muted)};`
  );
  lines.push(
    `  --muted-foreground: ${formatValue(overrides.text?.muted ?? tokens.legacy.mutedForeground)};`
  );
  lines.push(
    `  --popover: ${formatValue(overrides.background?.elevated ?? tokens.legacy.popover)};`
  );
  lines.push(
    `  --popover-foreground: ${formatValue(overrides.text?.primary ?? tokens.legacy.popoverForeground)};`
  );
  lines.push(
    `  --card: ${formatValue(overrides.background?.surface ?? tokens.legacy.card)};`
  );
  lines.push(
    `  --card-foreground: ${formatValue(overrides.text?.primary ?? tokens.legacy.cardForeground)};`
  );
  lines.push(`  --border: ${formatValue(tokens.legacy.border)};`);
  lines.push('  --border2: var(--border);');
  lines.push(`  --input: ${formatValue(tokens.legacy.input)};`);
  lines.push(
    `  --primary: ${formatValue(overrides.brand?.primary ?? tokens.legacy.primary)};`
  );
  lines.push(
    `  --primary-foreground: ${formatValue(tokens.legacy.primaryForeground)};`
  );
  lines.push(
    `  --secondary: ${formatValue(overrides.brand?.secondary ?? tokens.legacy.secondary)};`
  );
  lines.push(
    `  --secondary-foreground: ${formatValue(tokens.legacy.secondaryForeground)};`
  );
  lines.push(
    `  --accent: ${formatValue(overrides.brand?.accent ?? tokens.legacy.accent)};`
  );
  lines.push(
    `  --accent-foreground: ${formatValue(tokens.legacy.accentForeground)};`
  );
  lines.push('  --accent2: var(--accent);');
  lines.push('  --accent-foreground2: var(--accent-foreground);');
  lines.push(
    `  --destructive: ${formatValue(overrides.status?.error ?? tokens.legacy.destructive)};`
  );
  lines.push(
    `  --destructive-foreground: ${formatValue(tokens.legacy.destructiveForeground)};`
  );
  lines.push(`  --ring: ${formatValue(tokens.legacy.ring)};`);
  lines.push(`  --radius: ${formatValue(tokens.legacy.radius)};`);
  lines.push('');

  // Brand colors
  lines.push('  /* Brand colors */');
  lines.push(
    `  --brand-primary: ${formatValue(overrides.brand?.primary ?? tokens.brand.primary)};`
  );
  lines.push(
    `  --brand-primary-hover: ${formatValue(tokens.brand.primaryHover)};`
  );
  lines.push(
    `  --brand-primary-active: ${formatValue(tokens.brand.primaryActive)};`
  );
  lines.push(
    `  --brand-primary-subtle: ${formatValue(tokens.brand.primarySubtle)};`
  );
  lines.push(
    `  --brand-secondary: ${formatValue(overrides.brand?.secondary ?? tokens.brand.secondary)};`
  );
  lines.push(
    `  --brand-secondary-hover: ${formatValue(tokens.brand.secondaryHover)};`
  );
  lines.push(
    `  --brand-accent: ${formatValue(overrides.brand?.accent ?? tokens.brand.accent)};`
  );
  lines.push(
    `  --brand-accent-hover: ${formatValue(tokens.brand.accentHover)};`
  );
  lines.push('');

  // Background colors
  lines.push('  /* Background colors */');
  lines.push(
    `  --bg-page: ${formatValue(overrides.background?.page ?? tokens.background.page)};`
  );
  lines.push(
    `  --bg-surface: ${formatValue(overrides.background?.surface ?? tokens.background.surface)};`
  );
  lines.push(
    `  --bg-elevated: ${formatValue(overrides.background?.elevated ?? tokens.background.elevated)};`
  );
  lines.push(
    `  --bg-sunken: ${formatValue(overrides.background?.sunken ?? tokens.background.sunken)};`
  );
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
  lines.push(
    `  --bg-success: ${formatValue(overrides.status?.success ?? tokens.background.success)};`
  );
  lines.push(
    `  --bg-success-subtle: ${formatValue(tokens.background.successSubtle)};`
  );
  lines.push(
    `  --bg-warning: ${formatValue(overrides.status?.warning ?? tokens.background.warning)};`
  );
  lines.push(
    `  --bg-warning-subtle: ${formatValue(tokens.background.warningSubtle)};`
  );
  lines.push(
    `  --bg-error: ${formatValue(overrides.status?.error ?? tokens.background.error)};`
  );
  lines.push(
    `  --bg-error-subtle: ${formatValue(tokens.background.errorSubtle)};`
  );
  lines.push(
    `  --bg-info: ${formatValue(overrides.status?.info ?? tokens.background.info)};`
  );
  lines.push(
    `  --bg-info-subtle: ${formatValue(tokens.background.infoSubtle)};`
  );
  lines.push('');

  // Text colors
  lines.push('  /* Text colors */');
  lines.push(
    `  --text-primary: ${formatValue(overrides.text?.primary ?? tokens.text.primary)};`
  );
  lines.push(
    `  --text-secondary: ${formatValue(overrides.text?.secondary ?? tokens.text.secondary)};`
  );
  lines.push(`  --text-tertiary: ${formatValue(tokens.text.tertiary)};`);
  lines.push(
    `  --text-muted: ${formatValue(overrides.text?.muted ?? tokens.text.muted)};`
  );
  lines.push(`  --text-disabled: ${formatValue(tokens.text.disabled)};`);
  lines.push(
    `  --text-heading: ${formatValue(overrides.text?.heading ?? tokens.text.heading)};`
  );
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

  // Fun/celebration colors
  lines.push('  /* Fun/celebration colors */');
  lines.push(`  --fun-celebration: ${formatValue(tokens.fun.celebration)};`);
  lines.push(`  --fun-achievement: ${formatValue(tokens.fun.achievement)};`);
  lines.push(`  --fun-streak: ${formatValue(tokens.fun.streak)};`);
  lines.push(`  --fun-party: ${formatValue(tokens.fun.party)};`);
  lines.push('');

  // Shadow tokens
  lines.push('  /* Shadow tokens */');
  lines.push(
    `  --shadow-raised: ${overrides.shadow?.raised ?? tokens.shadow.raised};`
  );
  lines.push(
    `  --shadow-floating: ${overrides.shadow?.floating ?? tokens.shadow.floating};`
  );
  lines.push(`  --shadow-overlay: ${tokens.shadow.overlay};`);
  lines.push(`  --shadow-popup: ${tokens.shadow.popup};`);
  lines.push(`  --shadow-pop: ${tokens.shadow.pop};`);
  lines.push(`  --shadow-glow: ${tokens.shadow.glow};`);
  lines.push(`  --shadow-bounce: ${tokens.shadow.bounce};`);

  for (const [key, value] of Object.entries(
    getThemePresentationVariables(baseTheme, overrides)
  )) {
    lines.push(`  ${key}: ${value};`);
  }

  lines.push('}');

  // Add dark mode indicator if the base theme is dark
  if (baseTheme.mode === 'dark') {
    lines.push('');
    lines.push(`${selector} {`);
    lines.push('  color-scheme: dark;');
    lines.push('}');
  }

  return lines.join('\n');
}
