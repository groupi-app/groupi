import { getUserId } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { CreateWizard } from './components/create-wizard';
import { Suspense } from 'react';
import { NewEventFormBlank } from './components/new-event-form-blank';

export default function Page() {
  return (
    <div className='container max-w-4xl mt-10'>
      <h1 className='text-4xl font-heading mb-4'>New Event</h1>
      <Suspense fallback={<NewEventFormBlank />}>
        <NewEventContent />
      </Suspense>
    </div>
  );
}

async function NewEventContent() {
  'use cache: private';

  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  return <CreateWizard />;
}
