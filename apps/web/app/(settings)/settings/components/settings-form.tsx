'use client';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
// Migrated from server actions to tRPC hooks
import { useUpdateUserSettings } from '@groupi/hooks';
import { SettingsForm as SettingsFormType } from './settings-form-provider';
import { componentLogger } from '@/lib/logger';

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const methods = useFormContext<SettingsFormType>();

  // Use our new tRPC hook with integrated real-time sync
  const updateSettings = useUpdateUserSettings();

  // Submit handler: use tRPC mutation instead of server action
  const onSubmit = async (data: SettingsFormType) => {
    componentLogger.info({ data }, 'Updating user settings');

    updateSettings.updateSettings(data, {
      onSuccess: () => toast.success('Settings updated'),
      onError: () => toast.error('Failed to update settings'),
    });
  };

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
}
