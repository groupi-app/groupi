'use client';

import { EventGrid, EventMembershipData } from './components/event-grid';
import { EventsWelcomeHeader } from './components/events-welcome-header';
import { EventInvitesTab } from './components/event-invites-tab';
import { DiscoverTab } from './components/discover-tab';
import { EventFilters, SortBy } from '@/components/molecules';
import { useState, useMemo, useCallback } from 'react';
import {
  useUserEventsAndInvites,
  useDiscoverableEvents,
} from '@/hooks/convex/use-events';
import { isEventPast } from '@/lib/utils';
import { VisualEventCardSkeleton } from '@/components/skeletons';
import { MutedEventsProvider } from '@/hooks/convex/use-muting';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalUser } from '@/context/global-user-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { EventInvite } from '@/hooks/convex/use-event-invites';

type TabValue = 'upcoming' | 'attended' | 'invited' | 'discover';

/**
 * My Events Page - Redesigned with unified tabs
 *
 * Features:
 * - Personalized welcome header with event stats
 * - Unified tabs: Upcoming / Attended / Invited
 * - Filters (Only my events toggle, Sort) for event tabs
 * - Visual card grid with cover images
 * - Create event card
 * - Single query for events AND invites (no loading when switching tabs)
 */
export default function MyEventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from URL (single source of truth)
  const activeTab: TabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'attended') return 'attended';
    if (tabParam === 'invited') return 'invited';
    if (tabParam === 'discover') return 'discover';
    return 'upcoming';
  }, [searchParams]);

  const [onlyMine, setOnlyMine] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('lastactivity');

  // Get user from global context (loads separately from events)
  const { user } = useGlobalUser();
  const firstName = user?.name?.split(' ')[0];

  // Use combined Convex hook for real-time events + invites data
  const userEventsAndInvites = useUserEventsAndInvites();

  // Handle tab changes by updating URL
  const handleTabChange = useCallback(
    (value: string) => {
      const newTab = value as TabValue;

      // Update URL without full page reload
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === 'upcoming') {
        params.delete('tab');
      } else {
        params.set('tab', newTab);
      }
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Loading state - show actual controls with skeleton data
  if (userEventsAndInvites === undefined) {
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

        {/* Unified Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='mb-6 w-full max-w-lg'>
            <TabsTrigger
              value='upcoming'
              className='flex-1 min-w-0 text-xs sm:text-sm'
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value='attended'
              className='flex-1 min-w-0 text-xs sm:text-sm'
            >
              Attended
            </TabsTrigger>
            <TabsTrigger
              value='invited'
              className='flex-1 min-w-0 text-xs sm:text-sm'
            >
              Invited
            </TabsTrigger>
            <TabsTrigger
              value='discover'
              className='flex-1 min-w-0 text-xs sm:text-sm'
            >
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value='upcoming'>
            <EventFilters
              onlyMine={onlyMine}
              sortBy={sortBy}
              onOnlyMineChange={setOnlyMine}
              onSortChange={setSortBy}
              className='mb-6'
            />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
            </div>
          </TabsContent>

          <TabsContent value='attended'>
            <EventFilters
              onlyMine={onlyMine}
              sortBy={sortBy}
              onOnlyMineChange={setOnlyMine}
              onSortChange={setSortBy}
              className='mb-6'
            />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
            </div>
          </TabsContent>

          <TabsContent value='invited'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
            </div>
          </TabsContent>

          <TabsContent value='discover'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
              <VisualEventCardSkeleton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <MutedEventsProvider>
      <EventsPageContent
        userEventsAndInvites={userEventsAndInvites}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onlyMine={onlyMine}
        sortBy={sortBy}
        setOnlyMine={setOnlyMine}
        setSortBy={setSortBy}
      />
    </MutedEventsProvider>
  );
}

// Type for discoverable events from the query
type DiscoverableEventData = NonNullable<
  ReturnType<typeof useDiscoverableEvents>
>;

// Type for the combined query result
type UserEventsAndInvitesData = {
  events: EventMembershipData[];
  pendingInvites: EventInvite[];
  pendingInviteCount: number;
};

// Separated component to avoid hooks being called conditionally
function EventsPageContent({
  userEventsAndInvites,
  activeTab,
  onTabChange,
  onlyMine,
  sortBy,
  setOnlyMine,
  setSortBy,
}: {
  userEventsAndInvites: UserEventsAndInvitesData;
  activeTab: TabValue;
  onTabChange: (value: string) => void;
  onlyMine: boolean;
  sortBy: SortBy;
  setOnlyMine: (value: boolean) => void;
  setSortBy: (value: SortBy) => void;
}) {
  // Fetch discoverable events
  const discoverableEvents =
    (useDiscoverableEvents() as DiscoverableEventData) ?? [];
  const discoverCount = Array.isArray(discoverableEvents)
    ? discoverableEvents.length
    : 0;
  const memberships = useMemo(
    () => (userEventsAndInvites?.events || []) as EventMembershipData[],
    [userEventsAndInvites?.events]
  );

  const pendingInvites = userEventsAndInvites?.pendingInvites || [];
  const pendingInviteCount = userEventsAndInvites?.pendingInviteCount || 0;

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

  // Filter and sort events based on active tab
  const filteredEvents = useMemo(() => {
    // Determine time filter based on tab
    const isUpcomingTab = activeTab === 'upcoming';

    const filtered = memberships.filter((m: EventMembershipData) => {
      const isPast = isEventPast(
        m.event.chosenDateTime,
        m.event.chosenEndDateTime
      );

      // Time filter based on tab
      const matchesTime = isUpcomingTab ? !isPast : isPast;

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
  }, [memberships, activeTab, onlyMine, sortBy]);

  // Get filter-specific empty state messages
  const getEmptyStateProps = () => {
    const isUpcoming = activeTab === 'upcoming';

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
  const showCreateCard = activeTab === 'upcoming';

  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      {/* Welcome header with stats */}
      <EventsWelcomeHeader
        upcomingCount={counts.upcoming}
        hostingCount={counts.hostingUpcoming}
        className='mb-6'
      />

      {/* Unified Tabs: Upcoming / Attended / Invited */}
      <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
        <TabsList className='mb-6 w-full max-w-lg'>
          <TabsTrigger
            value='upcoming'
            className='flex-1 min-w-0 text-xs sm:text-sm'
          >
            Upcoming
            {counts.upcoming > 0 && (
              <span className='ml-1.5 text-xs text-muted-foreground'>
                {counts.upcoming}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value='attended'
            className='flex-1 min-w-0 text-xs sm:text-sm'
          >
            Attended
            {counts.past > 0 && (
              <span className='ml-1.5 text-xs text-muted-foreground'>
                {counts.past}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value='invited'
            className='flex-1 min-w-0 text-xs sm:text-sm flex items-center gap-2'
          >
            Invited
            {pendingInviteCount > 0 && (
              <Badge
                variant='destructive'
                className='ml-1 size-5 flex items-center justify-center p-0 text-xs'
              >
                {pendingInviteCount > 99 ? '99+' : pendingInviteCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value='discover'
            className='flex-1 min-w-0 text-xs sm:text-sm flex items-center gap-2'
          >
            Discover
            {discoverCount > 0 && (
              <span className='ml-1.5 text-xs text-muted-foreground'>
                {discoverCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='upcoming'>
          {/* Filters */}
          <EventFilters
            onlyMine={onlyMine}
            sortBy={sortBy}
            onOnlyMineChange={setOnlyMine}
            onSortChange={setSortBy}
            className='mb-6'
          />

          {/* Event grid */}
          <EventGrid
            events={filteredEvents}
            showCreateCard={showCreateCard}
            emptyMessage={emptyProps.message}
            emptyDescription={emptyProps.description}
          />
        </TabsContent>

        <TabsContent value='attended'>
          {/* Filters */}
          <EventFilters
            onlyMine={onlyMine}
            sortBy={sortBy}
            onOnlyMineChange={setOnlyMine}
            onSortChange={setSortBy}
            className='mb-6'
          />

          {/* Event grid */}
          <EventGrid
            events={filteredEvents}
            showCreateCard={false}
            emptyMessage={emptyProps.message}
            emptyDescription={emptyProps.description}
          />
        </TabsContent>

        <TabsContent value='invited'>
          <EventInvitesTab invites={pendingInvites} />
        </TabsContent>

        <TabsContent value='discover'>
          <DiscoverTab
            events={Array.isArray(discoverableEvents) ? discoverableEvents : []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
