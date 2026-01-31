import * as React from 'react';

import { cn } from '@/lib/utils';

export function Input({
  className,
  type,
  suppressHydrationWarning,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        // Rounded input with semantic tokens and smooth focus transition
        'flex h-10 w-full rounded-input border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      suppressHydrationWarning={suppressHydrationWarning}
      {...props}
    />
  );
}
