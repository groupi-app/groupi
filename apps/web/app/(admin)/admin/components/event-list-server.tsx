import { EventListClient } from './event-list-client';
import { getAllEventsAction } from '@/actions/admin-actions';

type EventListServerProps = {
  searchParams?: {
    eventCursor?: string;
    eventSearch?: string;
  };
};

export async function EventListServer({ searchParams }: EventListServerProps) {
  const cursor = searchParams?.eventCursor;
  const search = searchParams?.eventSearch;

  const [error, data] = await getAllEventsAction({
    cursor,
    limit: 50,
    search: search || undefined,
  });

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-destructive'>
          Error loading events: {error.message}
        </p>
      </div>
    );
  }

  return (
    <EventListClient
      initialEvents={data?.items || []}
      initialTotalCount={data?.totalCount || 0}
      initialNextCursor={data?.nextCursor}
      currentCursor={cursor}
      currentSearch={search}
    />
  );
}
