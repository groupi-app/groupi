import { NotificationMethodsList } from '@/components/notification-methods-list';
import { fetchUserSettings } from '@/lib/actions/settings';
import { currentUser } from '@clerk/nextjs/server';

export default async function NotificationSettings() {
  const settingsRes = await fetchUserSettings();
  if (!settingsRes.success) {
    return (
      <div className='text-red-500'>
        Failed to load settings: {settingsRes.error}
      </div>
    );
  }

  // Fetch emails from Clerk
  const user = await currentUser();
  const emails = user?.emailAddresses?.map(e => e.emailAddress) || [];

  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your notification preferences.
      </p>
      <NotificationMethodsList emails={emails} />
    </div>
  );
}
