import NewEventInfo from './components/new-event-info';
import { getCurrentUserId } from '@groupi/services';
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
  'use cache: private';

  // Validate session server-side (can now safely use headers/cookies)
  const [authError, userId] = await getCurrentUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  return <NewEventInfo />;
}
