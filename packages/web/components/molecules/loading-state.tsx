'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  /**
   * Optional message to display below the spinner
   */
  message?: string;
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
}: LoadingStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        layout === 'stacked' ? 'flex-col' : 'flex-row gap-2',
        sizes.container,
        className
      )}
    >
      {/* Sticker journal aesthetic - spinner in sticker container */}
      <div className='bg-muted rounded-full p-3 border-[3px] border-white shadow-raised'>
        <Loader2
          className={cn('animate-spin text-muted-foreground', sizes.spinner)}
        />
      </div>
      {message && (
        <p
          className={cn(
            'text-muted-foreground',
            layout === 'stacked' && 'mt-2',
            sizes.message
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
