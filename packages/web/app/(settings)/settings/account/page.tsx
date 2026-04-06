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
import { SettingsPageTemplate } from '@/components/templates';
import { EmptyState } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

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

/**
 * Account Settings Page - Uses Convex authentication components
 */
export default function AccountSettings() {
  return (
    <>
      <AuthLoading>
        <SettingsPageTemplate
          title='Account Settings'
          isLoading
          loadingContent={<AccountSettingsSkeleton />}
        >
          <div />
        </SettingsPageTemplate>
      </AuthLoading>

      <Unauthenticated>
        <SettingsPageTemplate title='Account Settings'>
          <EmptyState
            icon={<Lock className='h-10 w-10' />}
            message='Authentication Required'
            description='Please sign in to access your account settings.'
            action={
              <Link href='/sign-in'>
                <Button>Sign In</Button>
              </Link>
            }
          />
        </SettingsPageTemplate>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedAccountSettings />
      </Authenticated>
    </>
  );
}

function AuthenticatedAccountSettings() {
  const userAndPerson = useQuery(authQueries.getCurrentUserAndPerson, {});
  const { accounts: linkedAccounts, refetch: refetchAccounts } =
    useLinkedAccounts();

  if (!userAndPerson) {
    return (
      <SettingsPageTemplate
        title='Account Settings'
        isLoading
        loadingContent={<AccountSettingsSkeleton />}
      >
        <div />
      </SettingsPageTemplate>
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
    <SettingsPageTemplate
      title='Account Settings'
      description='Manage your account information and authentication methods.'
    >
      <AccountFormProvider defaultValues={defaultValues}>
        <div className='relative'>
          <AccountFormWithGuard>
            <AccountSettingsContent
              accountData={accountData}
              onAccountsChanged={refetchAccounts}
            />
          </AccountFormWithGuard>
        </div>
      </AccountFormProvider>
    </SettingsPageTemplate>
  );
}
