import NewEventInfo from './components/new-event-info';
import { getUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export default function Page() {
  return (
    <div className='container max-w-4xl mt-10'>
      <h1 className='text-4xl font-heading mb-4'>New Event</h1>
      <Suspense fallback={<Skeleton className='h-64 w-full' />}>
        <NewEventContent />
      </Suspense>
    </div>
  );
}

async function NewEventContent() {
  // Testing: Remove 'use cache: private' to see if Suspense alone is enough
  // Dynamic rendering - wrapped in Suspense boundary
  // Validate session server-side - getUserId() handles headers() internally
  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  return <NewEventInfo />;
}
