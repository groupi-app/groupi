import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Staged surface language. Interactive cards require a CardAction child. */
  treatment?: 'quiet' | 'featured' | 'interactive';
}

export function Card({ className, treatment, ...props }: CardProps) {
  return (
    <div
      data-slot='card'
      data-treatment={treatment}
      className={cn(
        // Clean elevated surface - sticker effect reserved for accents (buttons, badges, avatars)
        'rounded-card bg-card text-card-foreground border border-border shadow-raised transition-shadow duration-fast hover:shadow-floating',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot='card-header'
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot='card-title'
      className={cn(
        'text-xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot='card-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot='card-content'
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}

/** A card's single primary destination. Use asChild for an anchor/Next Link.
 * The stretched target keeps sibling controls separate: put them in CardActions.
 * Never wrap a card containing secondary controls inside a link or button.
 */
export function CardAction({
  asChild = false,
  className,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot='card-action'
      type={asChild ? undefined : type}
      className={cn('soft-card-action text-left', className)}
      {...props}
    />
  );
}

/** Independent controls rendered above the primary card hit target. */
export function CardActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot='card-actions'
      className={cn('relative z-lifted', className)}
      {...props}
    />
  );
}
