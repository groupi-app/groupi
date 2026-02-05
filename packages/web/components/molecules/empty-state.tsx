'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /**
   * Icon to display above the message
   */
  icon?: React.ReactNode;
  /**
   * Main message to display
   */
  message: string;
  /**
   * Optional secondary description
   */
  description?: string;
  /**
   * Optional action button/element
   */
  action?: React.ReactNode;
  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional class names
   */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'py-4',
    icon: 'h-6 w-6',
    message: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'py-8',
    icon: 'h-10 w-10',
    message: 'text-base',
    description: 'text-sm',
  },
  lg: {
    container: 'py-12',
    icon: 'h-12 w-12',
    message: 'text-lg',
    description: 'text-base',
  },
};

export function EmptyState({
  icon,
  message,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            // Sticker journal aesthetic - icon in sticker container
            'bg-muted rounded-full p-4 border-[3px] border-white shadow-raised mb-4 text-muted-foreground',
            sizes.icon
          )}
        >
          {icon}
        </div>
      )}
      <p className={cn('text-muted-foreground font-medium', sizes.message)}>
        {message}
      </p>
      {description && (
        <p
          className={cn(
            'text-muted-foreground/80 mt-1 max-w-sm',
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
