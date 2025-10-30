import { ConfirmSettings } from './components/confirm-settings';
import { fetchUserSettings } from '@groupi/services';
import { SettingsNav } from './components/settings-nav';
import ErrorPage from '@/components/error';
import { SettingsFormProvider } from './components/settings-form-provider';
import { SettingsForm } from './components/settings-form';
import { ReactNode } from 'react';

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [error, settingsData] = await fetchUserSettings({});

  if (error || !settingsData) {
    return <ErrorPage message='Unable to load user settings' />;
  }

  // Transform database data to only include form-editable fields
  type NotificationMethod = (typeof settingsData.notificationMethods)[number];
  type Notification = NotificationMethod['notifications'][number];

  const transformedData = {
    notificationMethods: settingsData.notificationMethods.map(
      (method: NotificationMethod) => ({
        type: method.type,
        value: method.value,
        enabled: method.enabled,
        name: method.name ?? undefined,
        notifications: method.notifications.map(
          (notification: Notification) => ({
            notificationType: notification.notificationType,
            enabled: notification.enabled,
          })
        ),
        // Include webhook-specific fields if present
        ...(method.webhookFormat && { webhookFormat: method.webhookFormat }),
        ...(method.customTemplate && { customTemplate: method.customTemplate }),
        ...(method.webhookHeaders && {
          webhookHeaders:
            typeof method.webhookHeaders === 'string'
              ? method.webhookHeaders
              : JSON.stringify(method.webhookHeaders),
        }),
      })
    ),
  };

  return (
    <SettingsFormProvider defaultValues={transformedData}>
      <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
        <SettingsNav />
        <div className='relative'>
          <SettingsForm>
            {children}
            <ConfirmSettings />
          </SettingsForm>
        </div>
      </div>
    </SettingsFormProvider>
  );
}
