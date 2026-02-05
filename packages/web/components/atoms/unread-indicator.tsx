import { cn } from '@/lib/utils';

export interface UnreadIndicatorProps {
  /** Number of unread items (if provided, shows as count badge) */
  count?: number;
  /** Show as a simple dot instead of a count */
  showDot?: boolean;
  /** Maximum count to display (shows "99+" if exceeded) */
  max?: number;
  /** Additional class names */
  className?: string;
}

/**
 * UnreadIndicator - Shows unread count or notification dot
 *
 * Can display either:
 * - A count badge (e.g., "5", "99+")
 * - A simple notification dot
 *
 * Uses the brand primary color for visibility.
 */
export function UnreadIndicator({
  count,
  showDot = false,
  max = 99,
  className,
}: UnreadIndicatorProps) {
  // If no count and showDot is false, don't render anything
  if (!showDot && (count === undefined || count === 0)) {
    return null;
  }

  // Show dot mode
  if (showDot || count === undefined) {
    return (
      <span
        data-slot='unread-indicator'
        className={cn(
          // Sticker journal aesthetic - dot with white border
          'inline-block size-2 rounded-full bg-destructive shrink-0 border-2 border-white shadow-raised',
          className
        )}
        aria-label='Unread'
      />
    );
  }

  // Show count mode
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      data-slot='unread-indicator'
      className={cn(
        // Sticker journal aesthetic - count badge with white border
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-badge text-xs font-semibold bg-destructive text-destructive-foreground border-2 border-white shadow-raised',
        className
      )}
      aria-label={`${count} unread`}
    >
      {displayCount}
    </span>
  );
}
