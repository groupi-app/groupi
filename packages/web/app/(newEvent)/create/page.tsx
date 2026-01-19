'use client';

import { CreateWizard } from './components/create-wizard';
import { NewEventFormBlank } from './components/new-event-form-blank';
import { Suspense } from 'react';

/**
 * New Event Page - Client-only architecture
 * - Authentication handled at layout level
 * - Real-time event creation with Convex mutations
 */
export default function Page() {
  return (
    <div className='container max-w-4xl mt-10'>
      <h1 className='text-4xl font-heading mb-4'>New Event</h1>
      <Suspense fallback={<NewEventFormBlank />}>
        <CreateWizard />
      </Suspense>
    </div>
  );
}
