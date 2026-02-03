import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

export interface HostingBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-7',
};

const iconSizeClasses = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4',
};

/**
 * HostingBadge - Crown badge indicating user is the event organizer
 *
 * Displays a crown icon in a circular badge to highlight
 * events the user is hosting.
 */
export function HostingBadge({ size = 'md', className }: HostingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-raised',
        sizeClasses[size],
        className
      )}
      aria-label='You are hosting this event'
    >
      <Icons.crown className={iconSizeClasses[size]} />
    </span>
  );
}
