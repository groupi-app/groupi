'use client';
import { AccountFormWithGuard } from './account-form-with-guard';

import Link from 'next/link';
import { ArrowRight, Trash2 as ActionTrash2 } from 'lucide-react';
import { UsernameField } from './username-field';
import { EmailManagement } from './email-management';
import { LinkedAccountsList } from './linked-accounts-list';
import { PasskeySettings } from './passkey-settings';
import { ConnectedAppsSettings } from '@/features/authorization';
import { DeleteAccountModal } from './delete-account-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId?: string;
};

export function AccountSettingsContent({
  accountData,
  onAccountsChanged,
}: {
  accountData: {
    username: string;
    email: string;
    linkedAccounts: LinkedAccount[];
  };
  onAccountsChanged?: () => void;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <AccountFormWithGuard>
        <Card>
          <CardHeader>
            <CardTitle>Username</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <UsernameField />
          </CardContent>
        </Card>
      </AccountFormWithGuard>

      <EmailManagement />

      <LinkedAccountsList
        linkedAccounts={accountData.linkedAccounts}
        userEmail={accountData.email}
        onAccountsChanged={onAccountsChanged}
      />

      <PasskeySettings />

      <ConnectedAppsSettings />

      <Link
        href='/settings/developer'
        className='flex min-h-11 items-center justify-between gap-3 rounded-input border border-border p-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring'
      >
        Developer settings
        <ArrowRight aria-hidden='true' className='size-4 shrink-0' />
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button
              icon={<ActionTrash2 aria-hidden='true' className='size-4' />}
              type='button'
              variant='destructive'
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        username={accountData.username}
      />
    </div>
  );
}
