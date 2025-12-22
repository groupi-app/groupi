'use client';

import { AccountSettingsData } from '@groupi/schema/data';
import { UsernameField } from './username-field';
import { EmailField } from './email-field';
import { LinkedAccountsList } from './linked-accounts-list';
import { DeleteAccountModal } from './delete-account-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface AccountSettingsContentProps {
  accountData: AccountSettingsData;
}

export function AccountSettingsContent({
  accountData,
}: AccountSettingsContentProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <UsernameField />
          <EmailField />
        </CardContent>
      </Card>

      <LinkedAccountsList
        linkedAccounts={accountData.linkedAccounts}
        userEmail={accountData.email}
      />

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
