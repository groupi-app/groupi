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
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
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
        'inline-block rounded-full shrink-0',
        sizeClasses[size],
        statusColors[status],
        pulse && status === 'online' && 'animate-pulse',
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
