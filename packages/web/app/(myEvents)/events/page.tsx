'use client';

import { EventGrid, EventMembershipData } from './components/event-grid';
import { EventsWelcomeHeader } from './components/events-welcome-header';
import { EventFilters, TimeFilter, SortBy } from '@/components/molecules';
import { useState, useMemo } from 'react';
import { useUserEvents } from '@/hooks/convex/use-events';
import { isEventPast } from '@/lib/utils';
import { VisualEventCardSkeleton } from '@/components/skeletons';
import { MutedEventsProvider } from '@/hooks/convex/use-muting';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalUser } from '@/context/global-user-context';

/**
 * My Events Page - Redesigned with Partiful-style visual cards
 *
 * Features:
 * - Personalized welcome header with event stats
 * - Independent filters (Time: Upcoming/Attended, Toggle: Only my events)
 * - Visual card grid with cover images
 * - Create event card
 */
export default function MyEventsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('lastactivity');

  // Get user from global context (loads separately from events)
  const { user } = useGlobalUser();
  const firstName = user?.name?.split(' ')[0];

  // Use Convex hook for real-time user events
  const userEventsData = useUserEvents();

  // Loading state - show actual controls with skeleton data
  if (userEventsData === undefined) {
    return (
      <div className='container mx-auto max-w-6xl px-4 py-8'>
        {/* Welcome header - use actual name if available */}
        <div className='space-y-2 mb-6'>
          <h1 className='text-4xl font-heading font-medium'>
            Hey,{' '}
            {firstName ?? (
              <Skeleton className='h-10 w-32 inline-block align-baseline' />
            )}
            !
          </h1>
          <Skeleton className='h-5 w-48' />
        </div>

        {/* Actual filter controls - functional but counts are hidden */}
        <EventFilters
          timeFilter={timeFilter}
          onlyMine={onlyMine}
          sortBy={sortBy}
          onTimeFilterChange={setTimeFilter}
          onOnlyMineChange={setOnlyMine}
          onSortChange={setSortBy}
          className='mb-6'
        />

        {/* Event grid skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <VisualEventCardSkeleton />
          <VisualEventCardSkeleton />
          <VisualEventCardSkeleton />
          <VisualEventCardSkeleton />
          <VisualEventCardSkeleton />
          <VisualEventCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <MutedEventsProvider>
      <EventsPageContent
        userEventsData={userEventsData}
        timeFilter={timeFilter}
        onlyMine={onlyMine}
        sortBy={sortBy}
        setTimeFilter={setTimeFilter}
        setOnlyMine={setOnlyMine}
        setSortBy={setSortBy}
      />
    </MutedEventsProvider>
  );
}

// Separated component to avoid hooks being called conditionally
function EventsPageContent({
  userEventsData,
  timeFilter,
  onlyMine,
  sortBy,
  setTimeFilter,
  setOnlyMine,
  setSortBy,
}: {
  userEventsData: NonNullable<ReturnType<typeof useUserEvents>>;
  timeFilter: TimeFilter;
  onlyMine: boolean;
  sortBy: SortBy;
  setTimeFilter: (filter: TimeFilter) => void;
  setOnlyMine: (value: boolean) => void;
  setSortBy: (value: SortBy) => void;
}) {
  const memberships = (userEventsData?.events || []) as EventMembershipData[];

  // Compute counts for filters
  const counts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    let hostingUpcoming = 0;

    memberships.forEach((m: EventMembershipData) => {
      const isPast = isEventPast(
        m.event.chosenDateTime,
        m.event.chosenEndDateTime
      );

      if (isPast) {
        past++;
      } else {
        upcoming++;
        if (m.membership.role === 'ORGANIZER') {
          hostingUpcoming++;
        }
      }
    });

    return { upcoming, past, hostingUpcoming };
  }, [memberships]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    const filtered = memberships.filter((m: EventMembershipData) => {
      const isPast = isEventPast(
        m.event.chosenDateTime,
        m.event.chosenEndDateTime
      );

      // Time filter
      const matchesTime = timeFilter === 'upcoming' ? !isPast : isPast;

      // Ownership filter
      const matchesOwnership = !onlyMine || m.membership.role === 'ORGANIZER';

      return matchesTime && matchesOwnership;
    });

    // Sort events
    return filtered.sort((a: EventMembershipData, b: EventMembershipData) => {
      switch (sortBy) {
        case 'title':
          return a.event.title.localeCompare(b.event.title);
        case 'createdat':
          return (b.event.createdAt ?? 0) - (a.event.createdAt ?? 0);
        case 'eventdate': {
          // TBD events (no date) go last
          const aDate = a.event.chosenDateTime ?? Number.MAX_SAFE_INTEGER;
          const bDate = b.event.chosenDateTime ?? Number.MAX_SAFE_INTEGER;
          return aDate - bDate;
        }
        case 'lastactivity':
        default:
          return (b.event.updatedAt ?? 0) - (a.event.updatedAt ?? 0);
      }
    });
  }, [memberships, timeFilter, onlyMine, sortBy]);

  // Get filter-specific empty state messages
  const getEmptyStateProps = () => {
    const isUpcoming = timeFilter === 'upcoming';

    if (isUpcoming && onlyMine) {
      return {
        message: "You're not hosting any upcoming events",
        description: 'Create an event to start hosting.',
      };
    } else if (isUpcoming) {
      return {
        message: 'No upcoming events',
        description: 'Create a new event or wait for invites.',
      };
    } else if (onlyMine) {
      return {
        message: "You haven't hosted any past events",
        description: 'Events you organize will appear here after they end.',
      };
    } else {
      return {
        message: 'No past events yet',
        description: "Events you've attended will appear here after they end.",
      };
    }
  };

  const emptyProps = getEmptyStateProps();

  // Only show create card on upcoming tab
  const showCreateCard = timeFilter === 'upcoming';

  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      {/* Welcome header with stats */}
      <EventsWelcomeHeader
        upcomingCount={counts.upcoming}
        hostingCount={counts.hostingUpcoming}
        className='mb-6'
      />

      {/* Filters */}
      <EventFilters
        timeFilter={timeFilter}
        onlyMine={onlyMine}
        sortBy={sortBy}
        onTimeFilterChange={setTimeFilter}
        onOnlyMineChange={setOnlyMine}
        onSortChange={setSortBy}
        counts={counts}
        className='mb-6'
      />

      {/* Event grid */}
      <EventGrid
        events={filteredEvents}
        showCreateCard={showCreateCard}
        emptyMessage={emptyProps.message}
        emptyDescription={emptyProps.description}
      />
    </div>
  );
}
