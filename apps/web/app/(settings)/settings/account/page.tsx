import { AccountSettingsContent } from '../components/account-settings-content';
import {
  getCachedAccountSettingsData,
  getSession,
} from '@groupi/services/server';
import { AccountSettingsSkeleton } from '@/components/skeletons/account-settings-skeleton';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountFormProvider } from '../components/account-form-provider';
import { AccountFormWithGuard } from '../components/account-form-with-guard';

/**
 * Account Settings Page - Dynamic rendering with Suspense
 */
export default async function AccountSettings() {
  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Account Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your account information and authentication methods.
      </p>
      <Suspense fallback={<AccountSettingsSkeleton />}>
        <AccountSettingsContentServer />
      </Suspense>
    </div>
  );
}

async function AccountSettingsContentServer() {
  const [sessionError, session] = await getSession();

  if (sessionError || !session) {
    redirect('/sign-in');
  }

  const [error, accountData] = await getCachedAccountSettingsData();

  if (error || !accountData) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold text-red-600'>Error</h2>
        <p className='mt-2'>
          An error occurred while loading your account settings.
        </p>
      </div>
    );
  }

  // Transform account data to form defaults
  const defaultValues = {
    username: accountData.username ?? '',
    email: accountData.email,
  };

  return (
    <AccountFormProvider defaultValues={defaultValues}>
      <div className='relative'>
        <AccountFormWithGuard>
          <AccountSettingsContent accountData={accountData} />
        </AccountFormWithGuard>
      </div>
    </AccountFormProvider>
  );
}
