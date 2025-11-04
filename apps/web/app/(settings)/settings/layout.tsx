import { ConfirmSettings } from './components/confirm-settings';
import { getCachedSettingsData } from '@groupi/services';
import { SettingsNav } from './components/settings-nav';
import ErrorPage from '@/components/error';
import { SettingsFormProvider } from './components/settings-form-provider';
import { SettingsForm } from './components/settings-form';
import { ReactNode, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
      <SettingsNav />
      <Suspense fallback={<SettingsLayoutSkeleton />}>
        <DynamicSettingsContent>{children}</DynamicSettingsContent>
      </Suspense>
    </div>
  );
}

async function DynamicSettingsContent({ children }: { children: ReactNode }) {
  // No 'use cache: private' - getCachedSettingsData calls auth functions which require runtime headers()
  // With cacheComponents: true, this ensures runtime rendering

  const [error, settingsData] = await getCachedSettingsData();

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
      <div className='relative'>
        <SettingsForm>
          {children}
          <ConfirmSettings />
        </SettingsForm>
      </div>
    </SettingsFormProvider>
  );
}

function SettingsLayoutSkeleton() {
  return (
    <div className='relative'>
      <Skeleton className='h-screen w-full' />
    </div>
  );
}
