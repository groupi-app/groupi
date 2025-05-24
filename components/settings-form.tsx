'use client';
import { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { useToast } from './ui/use-toast';
import { updateUserSettings } from '@/lib/actions/settings';

export function SettingsForm({ children }: { children: ReactNode }) {
  const methods = useFormContext();
  const { reset } = methods;
  const { toast } = useToast();

  // Submit handler: call server action to update settings
  const onSubmit = async (data: any) => {
    console.log('DATA', data);
    const res = await updateUserSettings(data);
    if (res?.error) {
      toast({
        title: 'Error',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings Saved',
        description: 'Your notification settings have been updated.',
      });
      reset(data); // Mark as not dirty
    }
  };

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
}
