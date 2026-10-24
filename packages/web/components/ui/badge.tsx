import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit max-w-full items-center gap-1 rounded-badge border-2 border-soft-sticker-color px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-soft-primary-subtle text-soft-primary-subtle-foreground',
        secondary:
          'bg-soft-secondary-subtle text-soft-secondary-subtle-foreground',
        destructive:
          'bg-soft-destructive-subtle text-soft-destructive-subtle-foreground',
        success: 'bg-soft-success-subtle text-soft-success-subtle-foreground',
        warning: 'bg-soft-warning-subtle text-soft-warning-subtle-foreground',
        info: 'bg-soft-info-subtle text-soft-info-subtle-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Compatibility alias: both values use the canonical cut-out treatment. */
  presentation?: 'default' | 'soft';
}
function Badge({
  className,
  variant,
  presentation = 'soft',
  ...props
}: BadgeProps) {
  return (
    <div
      data-slot='badge'
      data-presentation={presentation === 'default' ? 'soft' : presentation}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
export { Badge, badgeVariants };
