'use client';

import { useMemo } from 'react';
import type {
  ThemeTokenOverrides,
  BaseTheme,
} from '@groupi/shared/design/themes';
import { cn } from '@/lib/utils';

interface ThemePreviewProps {
  baseTheme: BaseTheme | undefined;
  overrides: ThemeTokenOverrides;
  className?: string;
}

/**
 * Adjust the lightness of an HSL color string.
 * Positive amount = lighter, negative amount = darker.
 */
function adjustLightness(hslString: string, amount: number): string {
  const hslMatch = hslString.match(
    /hsl\(\s*(\d+)\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?\s*\)/i
  );

  if (!hslMatch) {
    // If not HSL format, return as-is
    return hslString;
  }

  const h = parseInt(hslMatch[1], 10);
  const s = parseInt(hslMatch[2], 10);
  const l = parseInt(hslMatch[3], 10);

  // Clamp lightness between 0 and 100
  const newL = Math.max(0, Math.min(100, l + amount));

  return `hsl(${h}, ${s}%, ${newL}%)`;
}

/**
 * Generate a hover color from a base color.
 * Darkens by 7% for a subtle hover effect.
 */
function generateHoverColor(baseColor: string): string {
  return adjustLightness(baseColor, -7);
}

/**
 * Live preview of theme customizations.
 * Shows various UI elements with the current theme colors applied.
 */
export function ThemePreview({
  baseTheme,
  overrides,
  className,
}: ThemePreviewProps) {
  // Merge base theme tokens with overrides to create preview styles
  const previewStyles = useMemo(() => {
    if (!baseTheme) return {};

    const tokens = baseTheme.tokens;
    const styles: Record<string, string> = {};

    // Brand colors with auto-generated hover states
    const primaryColor = overrides.brand?.primary ?? tokens.brand.primary;
    const secondaryColor = overrides.brand?.secondary ?? tokens.brand.secondary;
    const accentColor = overrides.brand?.accent ?? tokens.brand.accent;

    styles['--preview-primary'] = primaryColor;
    styles['--preview-primary-hover'] = generateHoverColor(primaryColor);
    styles['--preview-secondary'] = secondaryColor;
    styles['--preview-secondary-hover'] = generateHoverColor(secondaryColor);
    styles['--preview-accent'] = accentColor;
    styles['--preview-accent-hover'] = generateHoverColor(accentColor);

    // Background colors
    styles['--preview-bg-page'] =
      overrides.background?.page ?? tokens.background.page;
    styles['--preview-bg-surface'] =
      overrides.background?.surface ?? tokens.background.surface;
    styles['--preview-bg-elevated'] =
      overrides.background?.elevated ?? tokens.background.elevated;

    // Text colors
    styles['--preview-text-primary'] =
      overrides.text?.primary ?? tokens.text.primary;
    styles['--preview-text-secondary'] =
      overrides.text?.secondary ?? tokens.text.secondary;
    styles['--preview-text-muted'] = overrides.text?.muted ?? tokens.text.muted;
    styles['--preview-text-on-primary'] = tokens.text.onPrimary;

    // Status colors
    styles['--preview-success'] =
      overrides.status?.success ?? tokens.background.success;
    styles['--preview-warning'] =
      overrides.status?.warning ?? tokens.background.warning;
    styles['--preview-error'] =
      overrides.status?.error ?? tokens.background.error;

    // Border
    styles['--preview-border'] = tokens.border.default;

    return styles;
  }, [baseTheme, overrides]);

  if (!baseTheme) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 text-muted-foreground',
          className
        )}
      >
        Select a base theme to preview
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-card overflow-hidden', className)}
      style={previewStyles as React.CSSProperties}
    >
      {/* Preview container with theme background */}
      <div
        className='p-4 space-y-4'
        style={{ backgroundColor: 'var(--preview-bg-page)' }}
      >
        {/* Header */}
        <div className='text-center mb-4'>
          <h3
            className='text-lg font-semibold'
            style={{ color: 'var(--preview-text-primary)' }}
          >
            Theme Preview
          </h3>
          <p className='text-sm' style={{ color: 'var(--preview-text-muted)' }}>
            See your changes in real-time
          </p>
        </div>

        {/* Card preview */}
        <div
          className='rounded-card p-4 space-y-3'
          style={{
            backgroundColor: 'var(--preview-bg-surface)',
            border: '1px solid var(--preview-border)',
          }}
        >
          {/* User info row */}
          <div className='flex items-center gap-3'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium'
              style={{
                backgroundColor: 'var(--preview-primary)',
                color: 'var(--preview-text-on-primary)',
              }}
            >
              JD
            </div>
            <div>
              <p
                className='font-medium text-sm'
                style={{ color: 'var(--preview-text-primary)' }}
              >
                Jane Doe
              </p>
              <p
                className='text-xs'
                style={{ color: 'var(--preview-text-secondary)' }}
              >
                Just now
              </p>
            </div>
          </div>

          {/* Post content */}
          <p
            className='text-sm'
            style={{ color: 'var(--preview-text-primary)' }}
          >
            This is what a post would look like with your custom theme colors!
          </p>

          {/* Buttons row with hover states */}
          <div className='flex flex-wrap gap-2'>
            <PreviewButton
              label='Primary'
              bgVar='--preview-primary'
              hoverVar='--preview-primary-hover'
            />
            <PreviewButton
              label='Secondary'
              bgVar='--preview-secondary'
              hoverVar='--preview-secondary-hover'
            />
            <PreviewButton
              label='Accent'
              bgVar='--preview-accent'
              hoverVar='--preview-accent-hover'
            />
          </div>
        </div>

        {/* Status badges */}
        <div className='flex flex-wrap gap-2'>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-success)',
              color: 'white',
            }}
          >
            Success
          </span>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-warning)',
              color: 'white',
            }}
          >
            Warning
          </span>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-error)',
              color: 'white',
            }}
          >
            Error
          </span>
        </div>

        {/* Input preview */}
        <div
          className='rounded-input px-3 py-2 text-sm'
          style={{
            backgroundColor: 'var(--preview-bg-surface)',
            border: '1px solid var(--preview-border)',
            color: 'var(--preview-text-muted)',
          }}
        >
          Type something here...
        </div>
      </div>
    </div>
  );
}

/**
 * Preview button with hover state support.
 * Uses CSS custom properties for colors and shows hover on mouse over.
 */
function PreviewButton({
  label,
  bgVar,
  hoverVar,
}: {
  label: string;
  bgVar: string;
  hoverVar: string;
}) {
  return (
    <button
      className='px-3 py-1.5 rounded-button text-xs font-medium transition-colors hover:opacity-90'
      style={{
        backgroundColor: `var(${bgVar})`,
        color: 'var(--preview-text-on-primary)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = `var(${hoverVar})`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = `var(${bgVar})`;
      }}
    >
      {label}
    </button>
  );
}
