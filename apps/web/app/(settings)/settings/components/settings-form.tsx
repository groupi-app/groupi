'use client';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
// Migrated from server actions to tRPC hooks
import { useUpdateUserSettings } from '@groupi/hooks';
import { log } from '@/lib/logger';
import { SettingsForm as SettingsFormType } from './settings-form-provider';

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const methods = useFormContext<SettingsFormType>();
  const { reset } = methods;

  // Use our new tRPC hook with integrated real-time sync
  const updateSettingsMutation = useUpdateUserSettings();

  // Submit handler: use tRPC mutation instead of server action
  const onSubmit = async (data: SettingsFormType) => {
    log.info('Updating user settings', { data });

    updateSettingsMutation.mutate(data, {
      onSuccess: ([error, _settings]) => {
        if (error) {
          toast.error('Error', {
            description: error.message || 'Failed to update settings',
          });
          return;
        }

        toast.success('Settings Saved', {
          description: 'Your notification settings have been updated.',
        });
        reset(data); // Mark as not dirty
      },
      onError: () => {
        toast.error('Error', {
          description: 'An unexpected error occurred. Please try again.',
        });
      },
    });
  };

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
}
