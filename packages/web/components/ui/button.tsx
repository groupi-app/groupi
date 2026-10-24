import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  // Base styles with dramatically rounded corners (Duolingo-style)
  // Using semantic radius token and bouncy hover effect
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-semibold transition-all duration-fast ease-bounce focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer',
  {
    variants: {
      presentation: {
        legacy: 'soft-action',
        soft: 'soft-action',
      },
      variant: {
        // Solid variants with sticker aesthetic (white border, shadow)
        default:
          'soft-action-filled soft-action-primary bg-primary text-primary-foreground border-2 border-white shadow-raised ',
        destructive:
          'soft-action-filled soft-action-destructive bg-destructive text-destructive-foreground border-2 border-white shadow-raised ',
        secondary:
          'soft-action-filled soft-action-secondary bg-secondary text-secondary-foreground border-2 border-white shadow-raised ',
        success: 'soft-action-filled soft-action-success',
        warning: 'soft-action-filled soft-action-warning',
        info: 'soft-action-filled soft-action-info',
        // Outline variants - subtle, no sticker effect
        outline:
          'border border-border bg-background hover:bg-accent/80 hover:text-accent-foreground',
        'outline-primary':
          'border border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary',
        // Minimal variants (no sticker effect)
        ghost: 'hover:bg-accent/80 hover:text-accent-foreground',
        'destructive-ghost':
          'soft-action-destructive-ghost text-text-error hover:bg-bg-error-subtle',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        xs: 'h-7 px-2 text-xs rounded-input',
        sm: 'h-9 px-3 text-xs rounded-input',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10 rounded-input',
      },
    },
    defaultVariants: {
      variant: 'default',
      presentation: 'soft',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Shows a loading spinner and disables the button
   */
  isLoading?: boolean;
  /**
   * Text to display when isLoading is true.
   * If not provided, children are shown in both states.
   */
  loadingText?: string;
  /**
   * Icon to display before the button text.
   * When isLoading is true, the icon is replaced with a spinner.
   */
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  presentation = 'soft',
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  icon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  // When using asChild, we can't modify the children structure
  if (asChild) {
    return (
      <Comp
        data-slot='button'
        data-presentation={presentation}
        data-variant={variant ?? 'default'}
        className={cn(
          buttonVariants({ variant, presentation, size, className })
        )}
        suppressHydrationWarning
        {...props}
        aria-busy={presentation === 'soft' && isLoading ? true : undefined}
        aria-disabled={
          presentation === 'soft' && (disabled || isLoading) ? true : undefined
        }
        onClickCapture={event => {
          if (presentation === 'soft' && (disabled || isLoading)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          props.onClickCapture?.(event);
        }}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot='button'
      data-presentation={presentation}
      data-variant={variant ?? 'default'}
      className={cn(buttonVariants({ variant, presentation, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2
          aria-hidden='true'
          className={cn(
            'size-4 animate-spin',
            presentation === 'soft' && 'motion-reduce:animate-none'
          )}
        />
      ) : icon ? (
        icon
      ) : null}
      {isLoading && loadingText ? loadingText : children}
    </Comp>
  );
}
