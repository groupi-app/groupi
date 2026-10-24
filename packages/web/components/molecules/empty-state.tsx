'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /**
   * Icon to display above the message
   */
  icon?: React.ReactNode;
  /** Opt-in gallery treatment. */
  presentation?: 'default' | 'soft';
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
  presentation = 'default',
}: EmptyStateProps) {
  const sizes = sizeClasses[size];
  const soft = presentation === 'soft';
  const Message = soft ? 'h3' : 'p';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        soft && 'gap-3 px-4',
        className
      )}
    >
      {icon && (
        <div
          aria-hidden={soft ? true : undefined}
          className={cn(
            // Sticker journal aesthetic - icon in sticker container
            soft
              ? 'rounded-avatar bg-muted p-4 text-foreground'
              : 'bg-muted rounded-full p-4 border-[3px] border-white shadow-raised mb-4 text-muted-foreground',
            !soft && sizes.icon
          )}
        >
          {soft ? (
            <div
              className={cn(
                'flex items-center justify-center [&>svg]:size-full',
                sizes.icon
              )}
            >
              {icon}
            </div>
          ) : (
            icon
          )}
        </div>
      )}
      <Message
        className={cn(
          soft
            ? 'text-foreground font-semibold text-balance'
            : 'text-muted-foreground font-medium',
          sizes.message
        )}
      >
        {message}
      </Message>
      {description && (
        <p
          className={cn(
            soft
              ? 'text-muted-foreground max-w-sm text-pretty'
              : 'text-muted-foreground/80 mt-1 max-w-sm',
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={cn(soft ? 'mt-1 max-w-full' : 'mt-4')}>{action}</div>
      )}
    </div>
  );
}
