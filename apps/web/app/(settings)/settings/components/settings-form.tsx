'use client';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { updateUserSettingsAction } from '@/actions/settings-actions';
import { SettingsForm as SettingsFormType } from './settings-form-provider';
import { componentLogger } from '@/lib/logger';

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
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
}
