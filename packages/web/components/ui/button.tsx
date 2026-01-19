import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
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
        className={cn(buttonVariants({ variant, size, className }))}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className='size-4 animate-spin' />
      ) : icon ? (
        icon
      ) : null}
      {isLoading && loadingText ? loadingText : children}
    </Comp>
  );
}
