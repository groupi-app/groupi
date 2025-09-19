'use client';

import { useSettingsPage } from '@groupi/hooks';
import { PushNotificationSettings } from './push-notification-settings';
import { NotificationMethodsList } from './notification-methods-list';

export function SettingsContent({
  emails,
  userId,
}: {
  emails: string[];
  userId: string;
}) {
  const { data, isLoading } = useSettingsPage();

  if (isLoading || !data) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-lg'>Loading settings...</div>
      </div>
    );
  }

  const [error] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'SettingsNotFoundError':
        errorMessage = 'Settings not found';
        break;
      case 'UserNotFoundError':
        errorMessage = 'User not found';
        break;
      case 'DatabaseError':
        errorMessage = error.message || 'Failed to load settings';
        break;
    }

    return (
      <div className='text-center py-8'>
        <h1 className='text-2xl font-bold text-red-600'>Error</h1>
        <p className='mt-2'>{errorMessage}</p>
      </div>
    );
  }

  // Settings data is available if no error
  return (
    <div className='space-y-6'>
      <PushNotificationSettings />
      <NotificationMethodsList emails={emails} userID={userId} />
    </div>
  );
}
