'use client';

import { useMemo } from 'react';
import {
  resolveThemePresentation,
  type ThemeTokenOverrides,
  type BaseTheme,
} from '@groupi/shared/design/themes';
import { cn } from '@/lib/utils';

interface ThemePreviewProps {
  baseTheme: BaseTheme | undefined;
  overrides: ThemeTokenOverrides;
  className?: string;
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

    const { tokens, actions, surface } = resolveThemePresentation(
      baseTheme,
      overrides
    );
    const styles: Record<string, string> = {
      '--preview-action-surface': surface,
    };
    for (const [role, treatment] of Object.entries(actions)) {
      styles[`--preview-${role}`] = treatment.fill;
      styles[`--preview-${role}-foreground`] = treatment.foreground;
      styles[`--preview-${role}-hover`] = treatment.hover;
      styles[`--preview-${role}-hover-foreground`] = treatment.hoverForeground;
    }

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
    styles['--preview-text-on-primary'] = actions.primary.foreground;

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
                backgroundImage:
                  'linear-gradient(var(--preview-primary), var(--preview-primary)), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))',
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
              foregroundVar='--preview-primary-foreground'
              hoverForegroundVar='--preview-primary-hover-foreground'
            />
            <PreviewButton
              label='Secondary'
              bgVar='--preview-secondary'
              hoverVar='--preview-secondary-hover'
              foregroundVar='--preview-secondary-foreground'
              hoverForegroundVar='--preview-secondary-hover-foreground'
            />
            <PreviewButton
              label='Accent'
              bgVar='--preview-accent'
              hoverVar='--preview-accent-hover'
              foregroundVar='--preview-accent-foreground'
              hoverForegroundVar='--preview-accent-hover-foreground'
            />
          </div>
        </div>

        {/* Status badges */}
        <div className='flex flex-wrap gap-2'>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-success)',
              backgroundImage:
                'linear-gradient(var(--preview-success), var(--preview-success)), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))',
              color: 'var(--preview-success-foreground)',
            }}
          >
            Success
          </span>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-warning)',
              backgroundImage:
                'linear-gradient(var(--preview-warning), var(--preview-warning)), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))',
              color: 'var(--preview-warning-foreground)',
            }}
          >
            Warning
          </span>
          <span
            className='px-2 py-1 rounded-badge text-xs font-medium'
            style={{
              backgroundColor: 'var(--preview-error)',
              backgroundImage:
                'linear-gradient(var(--preview-error), var(--preview-error)), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))',
              color: 'var(--preview-destructive-foreground)',
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
  foregroundVar,
  hoverForegroundVar,
}: {
  label: string;
  bgVar: string;
  hoverVar: string;
  foregroundVar: string;
  hoverForegroundVar: string;
}) {
  return (
    <button
      type='button'
      className='px-3 py-1.5 rounded-button text-xs font-medium transition-colors'
      style={{
        backgroundColor: `var(${bgVar})`,
        backgroundImage: `linear-gradient(var(${bgVar}), var(${bgVar})), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))`,
        color: `var(${foregroundVar})`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = `var(${hoverVar})`;
        e.currentTarget.style.backgroundImage = `linear-gradient(var(${hoverVar}), var(${hoverVar}))`;
        e.currentTarget.style.color = `var(${hoverForegroundVar})`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = `var(${bgVar})`;
        e.currentTarget.style.backgroundImage = `linear-gradient(var(${bgVar}), var(${bgVar})), linear-gradient(var(--preview-action-surface), var(--preview-action-surface))`;
        e.currentTarget.style.color = `var(${foregroundVar})`;
      }}
    >
      {label}
    </button>
  );
}
