import { AvailabilityServer } from './components/availability-server';
import { getUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

/**
 * Availability Page - Hybrid cache + realtime pattern
 * - Static shell: Container, heading, back button render immediately
 * - Dynamic content: Auth + cached data + realtime sync
 */
export default async function EventAvailabilityPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return (
    <div className='container max-w-5xl py-4'>
      {/* Static shell - renders immediately */}
      <div className='mb-6'>
        <Link href={`/event/${eventId}`}>
          <Button variant='ghost' className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>Back to Event</span>
          </Button>
        </Link>
      </div>

      <div className='mb-6'>
        <h1 className='text-3xl font-heading font-bold'>
          Set Your Availability
        </h1>
        <p className='text-muted-foreground mt-2'>
          Select the dates and times you are available for this event.
        </p>
      </div>

      {/* Dynamic content - wrapped in Suspense */}
      <Suspense fallback={<AvailabilityFormSkeleton />}>
        <DynamicAvailabilityContent eventId={eventId} />
      </Suspense>
    </div>
  );
}

async function DynamicAvailabilityContent({ eventId }: { eventId: string }) {
  // Dynamic rendering - wrapped in Suspense boundary
  // Auth check - getUserId() handles headers() internally with prerendering detection
  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  // Fetch cached data and pass to client with realtime
  return <AvailabilityServer eventId={eventId} userId={userId} />;
}

function AvailabilityFormSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-64 w-full' />
      <div className='flex justify-end gap-3'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}
