'use client';

import { cn } from '@/lib/utils';

/**
 * Color variants using design tokens.
 */
export type StepBadgeColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

const colorClasses: Record<StepBadgeColor, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
} as const;

export interface StepBadgeProps {
  /**
   * The step number or text to display.
   */
  children: React.ReactNode;
  /**
   * The background color of the badge.
   * @default 'primary'
   */
  color?: StepBadgeColor;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
}

/**
 * A circular badge for displaying step numbers with sticker styling.
 */
export function StepBadge({
  children,
  color = 'primary',
  className,
}: StepBadgeProps) {
  const role = color === 'error' ? 'destructive' : color;
  return (
    <div
      data-slot='step-badge'
      style={{
        backgroundColor: `var(--soft-${role}-composited-fill)`,
        color: `var(--soft-${role}-foreground)`,
      }}
      className={cn(
        // Base styles - circular with fixed size
        'size-10 flex-shrink-0',
        'flex items-center justify-center',
        // Circular shape
        'rounded-full',
        // Typography
        'text-lg font-black',
        // Shadow and border for sticker effect
        'shadow-raised border-[3px] border-white',
        // Color variant
        colorClasses[color],
        className
      )}
    >
      {children}
    </div>
  );
}
