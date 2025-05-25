import { ConfirmSettings } from '@/components/confirm-settings';
import { fetchUserSettings } from '@/lib/actions/settings';
import { SettingsNav } from '@/components/settings-nav';
import ErrorPage from '@/components/error';
import { SettingsFormProvider } from '@/components/settings-form-provider';
import { SettingsForm } from '@/components/settings-form';
import { ReactNode } from 'react';

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const data = await fetchUserSettings();

  if (data.error || !data.success) {
    return <ErrorPage message='Unable to load user settings' />;
  }

  const transformedData = {
    ...data.success,
    notificationMethods: data.success.notificationMethods.map(method => ({
      ...method,
      name: method.name ?? undefined,
    })),
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
