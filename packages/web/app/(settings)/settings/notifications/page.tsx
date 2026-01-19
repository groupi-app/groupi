'use client';

import { SettingsFormSkeleton } from '@/components/skeletons/settings-form-skeleton';
import { SettingsFormProvider } from '../components/settings-form-provider';
import { SettingsFormWithGuard } from '../components/settings-form-with-guard';
import { SettingsContent } from '../components/settings-content';
import { useNotificationMethodSettings } from '@/hooks/convex/use-settings';
import { useCurrentUserProfile } from '@/hooks/convex/use-users';
import { Authenticated, Unauthenticated, AuthLoading } from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotificationSettings() {
  return (
    <>
      <AuthLoading>
        <div className='md:container max-w-2xl mx-auto py-8'>
          <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
          <SettingsFormSkeleton />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className='md:container max-w-2xl mx-auto py-8'>
          <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
          <div className='text-center py-8'>
            <h2 className='text-xl font-bold'>Authentication Required</h2>
            <p className='mt-2 mb-6'>Please sign in to access your notification settings.</p>
            <Link href='/sign-in'>
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedNotificationSettings />
      </Authenticated>
    </>
  );
}

function AuthenticatedNotificationSettings() {
  const settings = useNotificationMethodSettings();
  const userProfile = useCurrentUserProfile();

  // Show skeleton while loading
  if (settings === undefined || userProfile === undefined) {
    return (
      <div className='md:container max-w-2xl mx-auto py-8'>
        <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
        <p className='mb-6 text-muted-foreground'>
          Manage your notification preferences.
        </p>
        <SettingsFormSkeleton />
      </div>
    );
  }

  // Type for notification method from Convex
  type ConvexMethod = {
    id: string;
    type: string;
    enabled: boolean;
    name?: string;
    value: string;
    webhookFormat?: string;
    customTemplate?: string;
    webhookHeaders?: unknown;
    notifications: Array<{ notificationType: string; enabled: boolean }>;
  };

  // Transform Convex data to form format
  const defaultValues = {
    notificationMethods: (settings.notificationMethods || []).map((method: ConvexMethod) => ({
      id: method.id,
      type: method.type as "EMAIL" | "PUSH" | "WEBHOOK",
      enabled: method.enabled,
      name: method.name || '',
      value: method.value,
      webhookFormat: method.webhookFormat as "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | undefined,
      customTemplate: method.customTemplate || '',
      webhookHeaders: method.webhookHeaders ? JSON.stringify(method.webhookHeaders) : '',
      notifications: method.notifications.map((n: { notificationType: string; enabled: boolean }) => ({
        notificationType: n.notificationType as "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP" | "USER_MENTIONED",
        enabled: n.enabled,
      })),
    })),
  };

  // Get all user emails for the settings content
  const primaryEmail = userProfile?.user?.email || '';
  const additionalEmails = userProfile?.user?.additionalEmails || [];
  const allEmails = [primaryEmail, ...additionalEmails];

  return (
    <div className='md:container max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-heading mb-4'>Notification Settings</h1>
      <p className='mb-6 text-muted-foreground'>
        Manage your notification preferences.
      </p>
      <SettingsFormProvider defaultValues={defaultValues}>
        <SettingsFormWithGuard>
          <SettingsContent emails={allEmails} />
        </SettingsFormWithGuard>
      </SettingsFormProvider>
    </div>
  );
}
