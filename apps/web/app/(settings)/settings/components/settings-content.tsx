import { getCachedSettingsData } from '@groupi/services';
import { PushNotificationSettings } from './push-notification-settings';
import { NotificationMethodsList } from './notification-methods-list';
import { redirect } from 'next/navigation';

export async function SettingsContent({
  emails,
  userId,
}: {
  emails: string[];
  userId: string;
}) {
  const [error] = await getCachedSettingsData();

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Settings not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
      // eslint-disable-next-line no-fallthrough
      default:
        return <div>Failed to load settings</div>;
    }
  }

  // Settings data is available if no error
  return (
    <div className='space-y-6'>
      <PushNotificationSettings />
      <NotificationMethodsList emails={emails} userID={userId} />
    </div>
  );
}
