import { cn } from '@/lib/utils';
import * as React from 'react';

export interface MenuItemContentProps {
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Primary label text */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Optional badge or indicator to display on the right */
  badge?: React.ReactNode;
  /** Whether this is a destructive action (shows red styling) */
  destructive?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * MenuItemContent - Consistent content layout for menu items
 *
 * Provides a reusable pattern for dropdown menu items, context menu items,
 * and other list-like UI elements. Supports:
 * - Leading icon
 * - Label with optional description
 * - Trailing badge/indicator
 * - Destructive (red) variant
 */
export function MenuItemContent({
  icon,
  label,
  description,
  badge,
  destructive = false,
  className,
}: MenuItemContentProps) {
  return (
    <div
      data-slot='menu-item-content'
      className={cn('flex items-center gap-2 w-full', className)}
    >
      {icon && (
        <span
          className={cn(
            'flex-shrink-0 size-4',
            destructive ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {icon}
        </span>
      )}
      <div className='flex flex-col flex-1 min-w-0'>
        <span
          className={cn(
            'text-sm truncate',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
        </span>
        {description && (
          <span className='text-xs text-muted-foreground truncate'>
            {description}
          </span>
        )}
      </div>
      {badge && <span className='flex-shrink-0 ml-auto'>{badge}</span>}
    </div>
  );
}
