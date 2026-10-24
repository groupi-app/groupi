import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Sticker journal aesthetic - pill badges with white border
  'inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-2 border-white shadow-raised',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-white shadow-raised',
        destructive:
          'bg-destructive text-destructive-foreground border-2 border-white shadow-raised',
        outline: 'text-foreground border border-border',
        success:
          'bg-bg-success text-text-on-primary border-2 border-white shadow-raised',
        warning:
          'bg-bg-warning text-text-primary border-2 border-white shadow-raised',
        info: 'bg-bg-info text-text-on-primary border-2 border-white shadow-raised',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Quiet semantic status treatment; no sticker depth. */
  presentation?: 'default' | 'soft';
}

function Badge({
  className,
  variant,
  presentation = 'default',
  style,
  ...props
}: BadgeProps) {
  const role = variant === 'default' || !variant ? 'primary' : variant;
  const soft = presentation === 'soft';
  return (
    <div
      data-slot='badge'
      className={cn(
        soft
          ? 'inline-flex items-center gap-1 rounded-badge border border-current/20 px-2.5 py-1 text-xs font-semibold'
          : badgeVariants({ variant }),
        className
      )}
      style={
        soft && role !== 'outline'
          ? {
              backgroundColor: `var(--soft-${role}-subtle)`,
              color: `var(--soft-${role}-subtle-foreground)`,
              ...style,
            }
          : style
      }
      {...props}
    />
  );
}

export { Badge, badgeVariants };
