import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Sticker journal aesthetic - pill badges with white border
  'inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-2 border-white shadow-raised hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-white shadow-raised hover:bg-secondary/80',
        destructive:
          'bg-destructive text-destructive-foreground border-2 border-white shadow-raised hover:bg-destructive/80',
        outline: 'text-foreground border border-border',
        success:
          'bg-bg-success text-text-on-primary border-2 border-white shadow-raised hover:opacity-80',
        warning:
          'bg-bg-warning text-text-primary border-2 border-white shadow-raised hover:opacity-80',
        info: 'bg-bg-info text-text-on-primary border-2 border-white shadow-raised hover:opacity-80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
