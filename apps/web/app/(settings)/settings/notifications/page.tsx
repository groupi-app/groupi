import { SettingsContent } from '../components/settings-content';
import { getCachedSettingsData, getSession } from '@groupi/services/server';
import { SettingsFormSkeleton } from '@/components/skeletons/settings-form-skeleton';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SettingsFormProvider } from '../components/settings-form-provider';
import { SettingsFormWithGuard } from '../components/settings-form-with-guard';
import ErrorPage from '@/components/error';

/**
 * Notification Settings Page - Dynamic rendering with Suspense
 */
export default async function NotificationSettings() {
  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your notification preferences.
      </p>
      <Suspense fallback={<SettingsFormSkeleton />}>
        <SettingsContentServer />
      </Suspense>
    </div>
  );
}

async function SettingsContentServer() {
  const [sessionError, session] = await getSession();

  if (sessionError || !session) {
    redirect('/sign-in');
  }

  const [error, settingsData] = await getCachedSettingsData();

  if (error || !settingsData) {
    return <ErrorPage message='Unable to load user settings' />;
  }

  // Transform database data to only include form-editable fields
  // Ensure notificationMethods is an array (default to empty array if undefined)
  const notificationMethods = settingsData.notificationMethods || [];
  type NotificationMethod = (typeof notificationMethods)[number];
  type Notification = NotificationMethod['notifications'][number];

  const transformedData = {
    notificationMethods: notificationMethods.map(
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

  const emails = [session.user.email]; // Better Auth uses single email

  return (
    <SettingsFormProvider defaultValues={transformedData}>
      <div className='relative'>
        <SettingsFormWithGuard>
          <SettingsContent emails={emails} userId={session.user.id} />
        </SettingsFormWithGuard>
      </div>
    </SettingsFormProvider>
  );
}
