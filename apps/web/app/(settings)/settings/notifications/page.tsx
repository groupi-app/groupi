import { SettingsContent } from '../components/settings-content';
import { getCachedSettingsData, getCurrentSession } from '@groupi/services';
import { SettingsFormSkeleton } from '@/components/skeletons/settings-form-skeleton';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Notification Settings Page - Uses private cache for user-specific data
 * - Settings data cached with "use cache: private" (5 min TTL)
 * - Ensures user isolation
 * - Cache invalidates on settings updates
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
  'use cache: private';

  const [sessionError, session] = await getCurrentSession();

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
