import { cn } from '@/lib/utils';
import { DisplayStatus } from '@/lib/utils';
import { Moon, Minus } from 'lucide-react';

export interface StatusIndicatorProps {
  /** The status to display */
  status: DisplayStatus;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Whether to show border (for overlaying on avatars) */
  showBorder?: boolean;
}

const sizeClasses = {
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-4',
};

const iconSizeClasses = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
};

const borderClasses = {
  sm: 'border border-background',
  md: 'border-2 border-background',
  lg: 'border-2 border-background',
};

/**
 * StatusIndicator - Discord-style status indicator
 *
 * Displays user status with appropriate icons:
 * - online: Green solid dot
 * - idle: Yellow crescent moon icon
 * - dnd: Red minus icon (Do Not Disturb)
 * - invisible/offline: Gray dot
 */
export function StatusIndicator({
  status,
  size = 'md',
  className,
  showBorder = true,
}: StatusIndicatorProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-full shrink-0',
    sizeClasses[size],
    showBorder && borderClasses[size],
    className
  );

  // Online: Green solid dot
  if (status === 'online') {
    return (
      <span
        data-slot='status-indicator'
        className={cn(baseClasses, 'bg-success')}
        aria-label='Status: Online'
      />
    );
  }

  // Idle: Yellow/orange background with crescent moon
  if (status === 'idle') {
    return (
      <span
        data-slot='status-indicator'
        className={cn(baseClasses, 'bg-warning')}
        aria-label='Status: Idle'
      >
        <Moon
          className={cn(
            iconSizeClasses[size],
            'text-warning-foreground fill-current'
          )}
          strokeWidth={0}
        />
      </span>
    );
  }

  // Do Not Disturb: Red background with minus
  if (status === 'dnd') {
    return (
      <span
        data-slot='status-indicator'
        className={cn(baseClasses, 'bg-error')}
        aria-label='Status: Do Not Disturb'
      >
        <Minus
          className={cn(iconSizeClasses[size], 'text-error-foreground')}
          strokeWidth={3}
        />
      </span>
    );
  }

  // Invisible or Offline: Gray dot
  return (
    <span
      data-slot='status-indicator'
      className={cn(baseClasses, 'bg-muted-foreground/50')}
      aria-label={`Status: ${status === 'invisible' ? 'Invisible' : 'Offline'}`}
    />
  );
}
