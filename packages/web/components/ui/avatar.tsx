'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/lib/utils';

export function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        // Clean avatar - subtle border for definition
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-avatar border border-border/50 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        // Fallback with semantic background color
        'flex h-full w-full items-center justify-center rounded-avatar bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
