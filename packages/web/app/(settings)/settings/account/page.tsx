'use client';

import { AccountSettingsContent } from '../components/account-settings-content';
import { AccountSettingsSkeleton } from '@/components/skeletons/account-settings-skeleton';
import { AccountFormProvider } from '../components/account-form-provider';
import { AccountFormWithGuard } from '../components/account-form-with-guard';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from '@/components/auth/auth-wrappers';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import { useLinkedAccounts } from '@/hooks/convex/use-accounts';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
function initApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
  }
}
initApi();
import { Button } from '@/components/ui/button';

/**
 * Account Settings Page - Uses Convex authentication components
 */
export default function AccountSettings() {
  return (
    <>
      <AuthLoading>
        <div className='md:container max-w-2xl mx-auto py-8'>
          <h1 className='text-2xl font-heading mb-4'>Account Settings</h1>
          <AccountSettingsSkeleton />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className='md:container max-w-2xl mx-auto py-8'>
          <h1 className='text-2xl font-heading mb-4'>Account Settings</h1>
          <div className='text-center py-8'>
            <h2 className='text-xl font-bold'>Authentication Required</h2>
            <p className='mt-2 mb-6'>
              Please sign in to access your account settings.
            </p>
            <Link href='/sign-in'>
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedAccountSettings />
      </Authenticated>
    </>
  );
}

function AuthenticatedAccountSettings() {
  const userAndPerson = useQuery(authQueries.getCurrentUserAndPerson, {});
  const linkedAccounts = useLinkedAccounts();

  if (!userAndPerson) {
    return (
      <div className='md:container max-w-2xl mx-auto py-8'>
        <h1 className='text-2xl font-heading mb-4'>Account Settings</h1>
        <AccountSettingsSkeleton />
      </div>
    );
  }

  const { user } = userAndPerson;

  // Transform user data to form defaults
  const defaultValues = {
    username: user.username ?? '',
    email: user.email,
  };

  // Pass linked accounts directly - they already have the correct format from Convex
  const formattedLinkedAccounts = linkedAccounts ?? [];

  // Convert to expected format for AccountSettingsContent
  const accountData = {
    username: user.username || '',
    email: user.email,
    linkedAccounts: formattedLinkedAccounts,
  };

  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Account Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your account information and authentication methods.
      </p>
      <AccountFormProvider defaultValues={defaultValues}>
        <div className='relative'>
          <AccountFormWithGuard>
            <AccountSettingsContent accountData={accountData} />
          </AccountFormWithGuard>
        </div>
      </AccountFormProvider>
    </div>
  );
}
