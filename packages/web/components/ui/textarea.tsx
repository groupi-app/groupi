import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Quiet writable field treatment; presentation is retained for compatibility. */
  presentation?: 'default' | 'soft';
}

export function Textarea({
  className,
  presentation = 'soft',
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        // Rounded textarea with semantic tokens
        'flex min-h-[80px] w-full rounded-input border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all duration-fast placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        presentation === 'soft' &&
          'border-2 bg-bg-sunken transition-colors aria-invalid:border-border-error aria-invalid:ring-error aria-invalid:focus-visible:border-border-error motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  );
}
