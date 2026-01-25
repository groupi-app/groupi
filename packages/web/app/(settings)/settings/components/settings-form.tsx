'use client';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { useSaveNotificationSettings } from '@/hooks/convex/use-settings';
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
  const saveNotificationSettings = useSaveNotificationSettings();

  // Submit handler: use Convex mutation
  const onSubmit = async (data: SettingsFormType) => {
    componentLogger.info('SettingsForm', 'Updating user settings', { data });

    // Transform form data to match Convex mutation schema
    const notificationMethods = (data.notificationMethods || []).map(
      method => ({
        id: method.id,
        type: method.type,
        enabled: method.enabled,
        name: method.name,
        value: method.value,
        webhookFormat: method.webhookFormat,
        customTemplate: method.customTemplate,
        webhookHeaders: method.webhookHeaders,
        notifications: method.notifications,
      })
    );

    await saveNotificationSettings(notificationMethods);
    methods.reset(data); // Reset form state after successful save
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
