'use client';

import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { updateAccountSettingsAction } from '@/actions/account-actions';
import { AccountForm as AccountFormType } from './account-form-provider';
import { componentLogger } from '@/lib/logger';
import { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Context to share onSubmit handler
const AccountFormContext = createContext<
  ((data: AccountFormType) => Promise<void>) | null
>(null);

export function useAccountFormSubmit() {
  const context = useContext(AccountFormContext);
  if (!context) {
    throw new Error('useAccountFormSubmit must be used within AccountForm');
  }
  return context;
}

export function AccountForm({ children }: { children: React.ReactNode }) {
  const methods = useFormContext<AccountFormType>();
  const router = useRouter();

  // Submit handler: use server action
  const onSubmit = async (data: AccountFormType) => {
    componentLogger.info({ data }, 'Updating account settings');

    const [error] = await updateAccountSettingsAction({
      username: data.username ?? null,
      email: data.email,
    });

    if (error) {
      toast.error('Failed to update account settings');
    } else {
      toast.success('Account settings updated');
      // Refresh router - cookie cache is now only 10 seconds, so updates should appear quickly
      router.refresh();
    }
  };

  return (
    <AccountFormContext.Provider value={onSubmit}>
      <Form {...methods}>
        <form id='account-form' onSubmit={methods.handleSubmit(onSubmit)}>
          {children}
        </form>
      </Form>
    </AccountFormContext.Provider>
  );
}
