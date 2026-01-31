import * as React from 'react';

import { cn } from '@/lib/utils';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot='card'
      className={cn(
        // Dramatically rounded card with semantic tokens (Duolingo-style)
        'rounded-card border bg-card text-card-foreground shadow-raised transition-shadow duration-fast hover:shadow-floating',
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
