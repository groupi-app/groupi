'use client';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { updateUserSettingsAction } from '@/actions/settings-actions';
import { SettingsForm as SettingsFormType } from './settings-form-provider';
import { componentLogger } from '@/lib/logger';
import { createContext, useContext } from 'react';

// Context to share onSubmit handler
const SettingsFormContext = createContext<
  ((data: SettingsFormType) => Promise<void>) | null
>(null);

export function useSettingsFormSubmit() {
  const context = useContext(SettingsFormContext);
  if (!context) {
    throw new Error('useSettingsFormSubmit must be used within SettingsForm');
  }
  return context;
}

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const methods = useFormContext<SettingsFormType>();

  // Submit handler: use server action
  const onSubmit = async (data: SettingsFormType) => {
    componentLogger.info({ data }, 'Updating user settings');

    const [error] = await updateUserSettingsAction(data);

    if (error) {
      toast.error('Failed to update settings');
    } else {
      toast.success('Settings updated');
    }
  };

  return (
    <SettingsFormContext.Provider value={onSubmit}>
      <Form {...methods}>
        <form id='settings-form' onSubmit={methods.handleSubmit(onSubmit)}>
          {children}
        </form>
      </Form>
    </SettingsFormContext.Provider>
  );
}
