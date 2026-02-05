import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface EventDateBadgeProps {
  /** Event date timestamp, or undefined for TBD */
  date?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * EventDateBadge - Displays event date or "TBD" in a badge overlay
 *
 * Used on visual event cards to show when the event is scheduled.
 * Shows "TBD" when no date is set.
 */
export function EventDateBadge({
  date,
  size = 'md',
  className,
}: EventDateBadgeProps) {
  const displayText = date ? format(new Date(date), 'MMM d') : 'TBD';

  return (
    <span
      className={cn(
        // Sticker journal aesthetic - date badge with white border
        'inline-flex items-center font-medium rounded-badge',
        'bg-card/90 backdrop-blur-sm shadow-raised border-2 border-white',
        sizeClasses[size],
        className
      )}
    >
      {displayText}
    </span>
  );
}
