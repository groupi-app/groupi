'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  /**
   * Optional message to display below the spinner
   */
  message?: string;
  /** Material presentation; Soft lift is the application default. */
  presentation?: 'default' | 'soft';
  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Whether to display inline (horizontal) or stacked (vertical)
   * @default "stacked"
   */
  layout?: 'inline' | 'stacked';
}

const sizeClasses = {
  sm: {
    container: 'py-4',
    spinner: 'h-5 w-5',
    message: 'text-xs',
  },
  md: {
    container: 'py-8',
    spinner: 'h-8 w-8',
    message: 'text-sm',
  },
  lg: {
    container: 'py-12',
    spinner: 'h-10 w-10',
    message: 'text-base',
  },
};

export function LoadingState({
  message,
  size = 'md',
  className,
  layout = 'stacked',
  presentation = 'soft',
}: LoadingStateProps) {
  const sizes = sizeClasses[size];
  const soft = presentation === 'soft';
  const statusMessage = message ?? (soft ? 'Loading…' : undefined);

  return (
    <div
      role={soft ? 'status' : undefined}
      aria-label={soft ? statusMessage : undefined}
      aria-live={soft ? 'polite' : undefined}
      className={cn(
        'flex items-center justify-center',
        layout === 'stacked' ? 'flex-col' : 'flex-row gap-2',
        sizes.container,
        className
      )}
    >
      {/* Sticker journal aesthetic - spinner in sticker container */}
      <div
        aria-hidden='true'
        className={cn(
          soft
            ? 'rounded-avatar bg-muted p-3 text-foreground'
            : 'bg-muted rounded-full p-3 border-[3px] border-white shadow-raised'
        )}
      >
        <Loader2
          className={cn(
            'animate-spin text-muted-foreground',
            soft && 'motion-reduce:animate-none',
            sizes.spinner
          )}
        />
      </div>
      {statusMessage && (
        <p
          className={cn(
            'text-muted-foreground',
            layout === 'stacked' && 'mt-2',
            sizes.message
          )}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
