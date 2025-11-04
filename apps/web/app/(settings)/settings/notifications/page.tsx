import { SettingsContent } from '../components/settings-content';
import { getCachedSettingsData, getSession } from '@groupi/services';
import { SettingsFormSkeleton } from '@/components/skeletons/settings-form-skeleton';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Notification Settings Page - Dynamic rendering with Suspense
 */
export default async function NotificationSettings() {
  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your notification preferences.
      </p>
      <Suspense fallback={<SettingsFormSkeleton />}>
        <SettingsContentServer />
      </Suspense>
    </div>
  );
}

async function SettingsContentServer() {
  // Testing: Remove 'use cache: private' to see if Suspense alone is enough
  // Dynamic rendering - wrapped in Suspense boundary
  const [sessionError, session] = await getSession();

  if (sessionError || !session) {
    redirect('/sign-in');
  }

  const [error] = await getCachedSettingsData();

  if (error) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold text-red-600'>Error</h2>
        <p className='mt-2'>An error occurred while loading your settings.</p>
      </div>
    );
  }

  const emails = [session.user.email]; // Better Auth uses single email

  return <SettingsContent emails={emails} userId={session.user.id} />;
}
