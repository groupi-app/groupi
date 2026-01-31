import * as React from 'react';

import { cn } from '@/lib/utils';

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        // Rounded textarea with semantic tokens
        'flex min-h-[80px] w-full rounded-input border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all duration-fast placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
