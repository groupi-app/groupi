import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export interface TimestampBadgeProps {
  /** The date/time to display (Date object or Unix timestamp in ms) */
  date: Date | number;
  /** Display format */
  formatStyle?: 'relative' | 'absolute' | 'smart';
  /** Optional prefix text (e.g., "Posted", "Updated") */
  prefix?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Format a date based on the style:
 * - relative: "2 hours ago", "3 days ago"
 * - absolute: "Jan 15, 2024"
 * - smart: Shows relative for recent, absolute for older
 */
function formatDate(
  date: Date,
  formatStyle: 'relative' | 'absolute' | 'smart'
): string {
  if (formatStyle === 'relative') {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (formatStyle === 'absolute') {
    return format(date, 'MMM d, yyyy');
  }

  // Smart format: relative for recent, contextual for older
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // Same year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d');
  }

  // Different year: show full date
  return format(date, 'MMM d, yyyy');
}

/**
 * TimestampBadge - Displays a formatted timestamp
 *
 * Provides consistent timestamp formatting across the app:
 * - relative: "2 hours ago", "3 days ago"
 * - absolute: "Jan 15, 2024"
 * - smart: Shows relative for recent, absolute for older dates
 *
 * Commonly used in: post cards, notifications, replies, activity feeds
 */
export function TimestampBadge({
  date,
  formatStyle = 'relative',
  prefix,
  className,
}: TimestampBadgeProps) {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const formattedDate = formatDate(dateObj, formatStyle);
  const fullDate = format(dateObj, 'PPpp'); // Full date for tooltip

  return (
    <time
      data-slot='timestamp-badge'
      dateTime={dateObj.toISOString()}
      title={fullDate}
      className={cn('text-xs text-muted-foreground', className)}
    >
      {prefix && <span className='mr-1'>{prefix}</span>}
      {formattedDate}
    </time>
  );
}
