'use client';

import { UsernameField } from './username-field';
import { EmailManagement } from './email-management';
import { LinkedAccountsList } from './linked-accounts-list';
import { PasskeySettings } from './passkey-settings';
import { ApiKeysSettings } from './api-keys-settings';
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
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <UsernameField />
        </CardContent>
      </Card>

      <EmailManagement />

      <LinkedAccountsList
        linkedAccounts={accountData.linkedAccounts}
        userEmail={accountData.email}
        onAccountsChanged={onAccountsChanged}
      />

      <PasskeySettings />

      <ApiKeysSettings />

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
