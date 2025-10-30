import { SettingsContent } from '../components/settings-content';
import { prefetchSettingsPageData } from '@groupi/hooks/server';
import { getCurrentSession } from '@groupi/services';
import { HydrationBoundary } from '@tanstack/react-query';
import { pageLogger } from '@/lib/logger';
import { redirect } from 'next/navigation';

export default async function NotificationSettings() {
  const [error, session] = await getCurrentSession();

  if (error || !session) {
    redirect('/sign-in');
  }

  const emails = [session.user.email]; // Better Auth uses single email

  try {
    // Prefetch settings page data
    // Services will get userId internally via getCurrentUserId()
    const dehydratedState = await prefetchSettingsPageData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='md:container max-w-2xl mx-auto py-8'>
          <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
          <p className='mb-6 text-muted-foreground'>
            Manage your notification preferences.
          </p>
          <SettingsContent emails={emails} userId={session.user.id} />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in notification settings page:');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading your settings.</p>
        </div>
      </div>
    );
  }
}
