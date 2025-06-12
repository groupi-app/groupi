import { DateCardList } from '@/components/date-card-list';
import ErrorPage from '@/components/error';
import { Icons } from '@/components/icons';
import QueryProvider from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { getEventPotentialDateTimes } from '@/lib/actions/availability';
import { getPDTQuery } from '@/lib/query-definitions';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  const data = await getEventPotentialDateTimes(eventId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    return <ErrorPage message={data.error} />;
  }

  if (data.success?.userRole !== 'ORGANIZER') {
    return (
      <ErrorPage message={'You do not have permission to view this page.'} />
    );
  }

  const queryDefinition = getPDTQuery(eventId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  return (
    <QueryProvider queryDefinition={queryDefinition}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className='container max-w-5xl py-4 flex flex-col'>
          <div className='w-max my-2'>
            <Link data-test='full-post-back' href={`/event/${eventId}`}>
              <Button
                variant={'ghost'}
                className='flex items-center gap-1 pl-2'
              >
                <Icons.back />
                <span>{data.success?.potentialDateTimes[0].event.title}</span>
              </Button>
            </Link>
          </div>
          <div>
            <h1 className='font-heading text-4xl my-4'>
              Choose a date/time for your event.
            </h1>
            <DateCardList eventId={eventId} />
          </div>
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
