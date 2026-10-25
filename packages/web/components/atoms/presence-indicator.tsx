import { cn } from '@/lib/utils';

export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy';

export interface PresenceIndicatorProps {
  /** The presence status to display */
  status: PresenceStatus;
  /** Size of the indicator dot */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Whether to show a pulsing animation for online status */
  pulse?: boolean;
}

const statusColors: Record<PresenceStatus, string> = {
  online: 'bg-fun-achievement', // Green - using fun token
  offline: 'bg-muted-foreground/50',
  away: 'bg-fun-streak', // Orange - using fun token
  busy: 'bg-destructive',
};

const sizeClasses = {
  sm: 'size-2 border',
  md: 'size-2.5 border',
  lg: 'size-3 border-2',
};

/**
 * PresenceIndicator - Shows online/offline status as a colored dot
 *
 * Displays a user's presence status with appropriate color coding:
 * - online: Green with optional pulse animation
 * - offline: Gray/muted
 * - away: Orange
 * - busy: Red
 */
export function PresenceIndicator({
  status,
  size = 'sm',
  className,
  pulse = false,
}: PresenceIndicatorProps) {
  return (
    <span
      data-slot='presence-indicator'
      className={cn(
        // Keep a visible color core at small sizes while retaining the sticker edge
        'inline-block rounded-full shrink-0 border-white',
        sizeClasses[size],
        statusColors[status],
        pulse && status === 'online' && 'animate-pulse',
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
