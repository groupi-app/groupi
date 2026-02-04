'use client';

import { cn } from '@/lib/utils';

export interface EventStatsProps {
  /** Number of upcoming events */
  upcomingCount: number;
  /** Number of events user is hosting */
  hostingCount: number;
  /** Additional class names */
  className?: string;
}

/**
 * EventStats - Summary of user's event counts
 *
 * Displays a friendly summary like "You have 3 upcoming events"
 */
export function EventStats({
  upcomingCount,
  hostingCount,
  className,
}: EventStatsProps) {
  const getMessage = () => {
    if (upcomingCount === 0 && hostingCount === 0) {
      return "You don't have any events yet";
    }
    if (upcomingCount === 0) {
      return 'No upcoming events';
    }
    if (upcomingCount === 1) {
      return hostingCount === 1
        ? "You have 1 upcoming event that you're hosting"
        : 'You have 1 upcoming event';
    }
    return `You have ${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'}`;
  };

  return (
    <p className={cn('text-muted-foreground', className)}>{getMessage()}</p>
  );
}
