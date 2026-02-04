'use client';

import { useGlobalUser } from '@/context/global-user-context';
import { EventStats } from '@/components/molecules';
import { cn } from '@/lib/utils';

export interface EventsWelcomeHeaderProps {
  /** Number of upcoming events */
  upcomingCount: number;
  /** Number of events user is hosting */
  hostingCount: number;
  /** Additional class names */
  className?: string;
}

/**
 * EventsWelcomeHeader - Personalized welcome message with event stats
 */
export function EventsWelcomeHeader({
  upcomingCount,
  hostingCount,
  className,
}: EventsWelcomeHeaderProps) {
  const { user } = useGlobalUser();

  // Get first name for personalized greeting
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className={cn('space-y-2', className)}>
      <h1 className='text-4xl font-heading font-medium'>Hey, {firstName}!</h1>
      <EventStats upcomingCount={upcomingCount} hostingCount={hostingCount} />
    </div>
  );
}
