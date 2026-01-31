import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-card border p-6 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-border-success bg-bg-success-subtle text-text-success [&>svg]:text-text-success',
        warning:
          'border-border-default bg-bg-warning-subtle text-text-warning [&>svg]:text-text-warning',
        info: 'border-border-default bg-bg-info-subtle text-text-primary [&>svg]:text-brand-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot='alert'
      role='alert'
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      data-slot='alert-title'
      className={cn(
        'mb-1 font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot='alert-description'
      className={cn('text-sm opacity-90 [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}
