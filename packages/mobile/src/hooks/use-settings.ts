import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReturnType } from 'convex/server';

import { api } from 'convex/_generated/api';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

type SaveNotificationSettingsArgs = FunctionArgs<
  typeof api.settings.mutations.saveNotificationSettings
>;
type NotificationSettingsResult = FunctionReturnType<
  typeof api.settings.queries.getNotificationSettings
>;

export type NotificationMethod =
  SaveNotificationSettingsArgs['notificationMethods'][number];
export type NotificationType =
  NotificationMethod['notifications'][number]['notificationType'];
type QueriedNotificationMethod =
  NotificationSettingsResult['notificationMethods'][number];
type QueriedNotificationType =
  QueriedNotificationMethod['notifications'][number]['notificationType'];

export const SUPPORTED_NOTIFICATION_TYPES: readonly NotificationType[] = [
  'EVENT_EDITED',
  'NEW_POST',
  'NEW_REPLY',
  'DATE_CHOSEN',
  'DATE_CHANGED',
  'DATE_RESET',
  'USER_JOINED',
  'USER_LEFT',
  'USER_PROMOTED',
  'USER_DEMOTED',
  'USER_RSVP',
  'USER_MENTIONED',
  'EVENT_REMINDER',
  'FRIEND_REQUEST_RECEIVED',
  'FRIEND_REQUEST_ACCEPTED',
  'EVENT_INVITE_RECEIVED',
  'EVENT_INVITE_ACCEPTED',
  'ADDON_CONFIG_RESET',
  'ADDON_AUTOMATION',
];

function isSupportedNotificationType(
  type: QueriedNotificationType
): type is NotificationType {
  switch (type) {
    case 'EVENT_EDITED':
    case 'NEW_POST':
    case 'NEW_REPLY':
    case 'DATE_CHOSEN':
    case 'DATE_CHANGED':
    case 'DATE_RESET':
    case 'USER_JOINED':
    case 'USER_LEFT':
    case 'USER_PROMOTED':
    case 'USER_DEMOTED':
    case 'USER_RSVP':
    case 'USER_MENTIONED':
    case 'EVENT_REMINDER':
    case 'FRIEND_REQUEST_RECEIVED':
    case 'FRIEND_REQUEST_ACCEPTED':
    case 'EVENT_INVITE_RECEIVED':
    case 'EVENT_INVITE_ACCEPTED':
    case 'ADDON_CONFIG_RESET':
    case 'ADDON_AUTOMATION':
      return true;
    default:
      return false;
  }
}

function serializeHeaders(headers: unknown) {
  if (!headers) return undefined;
  if (typeof headers === 'string') return headers;
  try {
    return JSON.stringify(headers);
  } catch {
    return undefined;
  }
}

export function normalizeNotificationMethods(
  methods: NotificationSettingsResult['notificationMethods']
): NotificationMethod[] {
  return methods.map(method => ({
    id: method.id,
    type: method.type,
    enabled: method.enabled,
    name: method.name,
    value: method.value,
    webhookFormat: method.webhookFormat,
    customTemplate: method.customTemplate,
    webhookHeaders: serializeHeaders(method.webhookHeaders),
    notifications: method.notifications.flatMap(notification =>
      isSupportedNotificationType(notification.notificationType)
        ? [
            {
              notificationType: notification.notificationType,
              enabled: notification.enabled,
            },
          ]
        : []
    ),
  }));
}

export function usePrivacySettings() {
  const { isAuthenticated } = useGlobalUser();
  return useQuery(
    api.settings.queries.getPrivacySettings,
    isAuthenticated ? {} : 'skip'
  );
}

export function useSavePrivacySettings() {
  const mutation = useMutation(api.settings.mutations.savePrivacySettings);

  return useCallback(
    async (
      settings: Omit<
        FunctionArgs<typeof api.settings.mutations.savePrivacySettings>,
        '_traceId'
      >
    ) => {
      try {
        await mutation(settings);
        toast.success('Privacy settings saved');
        return true;
      } catch {
        toast.error('Failed to save privacy settings');
        return false;
      }
    },
    [mutation]
  );
}

export function useNotificationSettings() {
  const { isAuthenticated } = useGlobalUser();
  const settings = useQuery(
    api.settings.queries.getNotificationSettings,
    isAuthenticated ? {} : 'skip'
  );

  return {
    personSettings: settings?.personSettings ?? null,
    notificationMethods: normalizeNotificationMethods(
      settings?.notificationMethods ?? []
    ),
    isLoading: isAuthenticated && settings === undefined,
  };
}

export function useSaveNotificationSettings() {
  const mutation = useMutation(api.settings.mutations.saveNotificationSettings);

  return useCallback(
    async (notificationMethods: NotificationMethod[]) => {
      try {
        await mutation({ notificationMethods });
        return true;
      } catch {
        toast.error('Failed to update notification settings');
        return false;
      }
    },
    [mutation]
  );
}
