import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export function usePrivacySettings() {
  return useQuery(api.settings.queries.getPrivacySettings, {});
}

export function useSavePrivacySettings() {
  const mutation = useMutation(api.settings.mutations.savePrivacySettings);

  return useCallback(
    async (settings: {
      allowFriendRequestsFrom: string;
      allowEventInvitesFrom: string;
    }) => {
      try {
        await mutation(settings);
        toast.success('Privacy settings saved');
      } catch {
        toast.error('Failed to save privacy settings');
      }
    },
    [mutation]
  );
}

export function useNotificationSettings() {
  return useQuery(api.settings.queries.getNotificationSettings, {});
}

export function useSaveNotificationSettings() {
  const mutation = useMutation(api.settings.mutations.saveNotificationSettings);

  return useCallback(
    async (settings: {
      notificationMethods: Array<{
        type: 'EMAIL' | 'PUSH' | 'WEBHOOK';
        value: string;
        enabled: boolean;
        notifications: Array<{
          notificationType: string;
          enabled: boolean;
        }>;
        name?: string;
        webhookFormat?: string;
        customTemplate?: string;
        webhookHeaders?: string;
      }>;
    }) => {
      try {
        await mutation(settings);
        toast.success('Notification settings saved');
      } catch {
        toast.error('Failed to save notification settings');
      }
    },
    [mutation]
  );
}
