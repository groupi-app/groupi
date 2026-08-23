import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { LoadingState } from '@/components/molecules';
import { useGlobalUser } from '@/context/global-user-context';
import {
  type NotificationMethod,
  type NotificationType,
  SUPPORTED_NOTIFICATION_TYPES,
  useNotificationSettings,
  useSaveNotificationSettings,
} from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/context/push-notification-context';

interface NotificationPreference {
  type: NotificationType;
  label: string;
  description: string;
}

const NOTIFICATION_CATEGORIES: Array<{
  title: string;
  items: NotificationPreference[];
}> = [
  {
    title: 'Events',
    items: [
      {
        type: 'EVENT_EDITED',
        label: 'Event updates',
        description: 'Details change for an event you joined.',
      },
      {
        type: 'DATE_CHOSEN',
        label: 'Date selected',
        description: 'An organizer chooses the event date.',
      },
      {
        type: 'DATE_CHANGED',
        label: 'Date changed',
        description: 'A selected event date changes.',
      },
      {
        type: 'DATE_RESET',
        label: 'New date poll',
        description: 'An organizer starts a new availability poll.',
      },
      {
        type: 'EVENT_REMINDER',
        label: 'Event reminders',
        description: 'An event you’re attending is starting soon.',
      },
    ],
  },
  {
    title: 'Posts and replies',
    items: [
      {
        type: 'NEW_POST',
        label: 'New posts',
        description: 'Someone posts in an event you joined.',
      },
      {
        type: 'NEW_REPLY',
        label: 'New replies',
        description: 'Someone replies to a post you follow.',
      },
      {
        type: 'USER_MENTIONED',
        label: 'Mentions',
        description: 'Someone mentions you in a post or reply.',
      },
    ],
  },
  {
    title: 'Members',
    items: [
      {
        type: 'USER_JOINED',
        label: 'Member joined',
        description: 'Someone joins an event you manage.',
      },
      {
        type: 'USER_LEFT',
        label: 'Member left',
        description: 'Someone leaves an event you manage.',
      },
      {
        type: 'USER_RSVP',
        label: 'RSVP updates',
        description: 'Someone responds to an event you manage.',
      },
      {
        type: 'USER_PROMOTED',
        label: 'Promoted to moderator',
        description: 'You become a moderator of an event.',
      },
      {
        type: 'USER_DEMOTED',
        label: 'Moderator role removed',
        description: 'Your moderator role changes.',
      },
    ],
  },
  {
    title: 'Friends and invitations',
    items: [
      {
        type: 'FRIEND_REQUEST_RECEIVED',
        label: 'Friend requests',
        description: 'Someone sends you a friend request.',
      },
      {
        type: 'FRIEND_REQUEST_ACCEPTED',
        label: 'Accepted requests',
        description: 'Someone accepts your friend request.',
      },
      {
        type: 'EVENT_INVITE_RECEIVED',
        label: 'Event invitations',
        description: 'Someone invites you to an event.',
      },
      {
        type: 'EVENT_INVITE_ACCEPTED',
        label: 'Accepted invitations',
        description: 'Someone accepts your event invitation.',
      },
    ],
  },
  {
    title: 'Add-ons',
    items: [
      {
        type: 'ADDON_CONFIG_RESET',
        label: 'Response resets',
        description: 'An add-on changes and needs a new response from you.',
      },
      {
        type: 'ADDON_AUTOMATION',
        label: 'Automations',
        description: 'An event add-on sends an automated update.',
      },
    ],
  },
];

function getMethodLabel(method: NotificationMethod) {
  if (method.name?.trim()) return method.name;
  if (method.type === 'EMAIL') return 'Email';
  if (method.type === 'PUSH') return 'Push notifications';
  return 'Webhook';
}

function getMethodDescription(method: NotificationMethod) {
  if (method.type === 'EMAIL') return method.value;
  if (method.type === 'PUSH') return 'Your registered mobile devices';
  return method.webhookFormat
    ? `${method.webhookFormat.toLowerCase()} webhook`
    : 'Webhook';
}

export default function NotificationSettingsScreen() {
  const { user } = useGlobalUser();
  const { notificationMethods, isLoading } = useNotificationSettings();
  const saveNotificationSettings = useSaveNotificationSettings();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const saveInFlight = useRef(false);
  const isSaving = savingKey !== null;
  const primaryColor = String(useCSSVariable('--color-primary'));
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const selectedMethod =
    notificationMethods.find(method => method.id === selectedMethodId) ??
    notificationMethods[0];
  const accountEmail =
    typeof user?.email === 'string' && user.email.includes('@')
      ? user.email
      : null;
  const hasAccountEmailMethod = notificationMethods.some(
    method => method.type === 'EMAIL' && method.value === accountEmail
  );

  async function saveMethods(key: string, nextMethods: NotificationMethod[]) {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSavingKey(key);
    try {
      await saveNotificationSettings(nextMethods);
    } finally {
      saveInFlight.current = false;
      setSavingKey(null);
    }
  }

  function toggleMethod(method: NotificationMethod, enabled: boolean) {
    void saveMethods(
      `method-${method.id ?? method.value}`,
      notificationMethods.map(current =>
        current.id === method.id ? { ...current, enabled } : current
      )
    );
  }

  function togglePreference(type: NotificationType, enabled: boolean) {
    if (!selectedMethod) return;

    const existingSetting = selectedMethod.notifications.some(
      notification => notification.notificationType === type
    );
    const notifications = existingSetting
      ? selectedMethod.notifications.map(notification =>
          notification.notificationType === type
            ? { ...notification, enabled }
            : notification
        )
      : [...selectedMethod.notifications, { notificationType: type, enabled }];

    void saveMethods(
      `preference-${selectedMethod.id ?? selectedMethod.value}-${type}`,
      notificationMethods.map(method =>
        method.id === selectedMethod.id ? { ...method, notifications } : method
      )
    );
  }

  function addAccountEmail() {
    if (!accountEmail) return;
    const emailMethod: NotificationMethod = {
      type: 'EMAIL',
      name: 'Primary email',
      value: accountEmail,
      enabled: true,
      notifications: SUPPORTED_NOTIFICATION_TYPES.map(notificationType => ({
        notificationType,
        enabled: true,
      })),
    };
    void saveMethods('add-email', [...notificationMethods, emailMethod]);
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <SettingsHeader />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <SettingsHeader />

      <ScrollView
        className='flex-1'
        contentContainerClassName='gap-7 px-4 pb-10 pt-2'
      >
        <PushDeviceCard />

        <View className='gap-3'>
          <View>
            <Text className='text-lg font-bold text-foreground'>
              Delivery methods
            </Text>
            <Text className='mt-1 text-sm text-muted-foreground'>
              Choose where Groupi should send updates. Each method can have its
              own preferences.
            </Text>
          </View>

          {notificationMethods.length === 0 ? (
            <View className='items-start gap-3 rounded-card border border-border bg-card p-4'>
              <View className='flex-row items-center gap-3'>
                <View className='h-10 w-10 items-center justify-center rounded-badge bg-muted'>
                  <Ionicons
                    name='notifications-outline'
                    size={20}
                    color={mutedColor}
                  />
                </View>
                <View className='flex-1'>
                  <Text className='font-semibold text-foreground'>
                    No delivery methods yet
                  </Text>
                  <Text className='mt-0.5 text-sm text-muted-foreground'>
                    In-app notifications will still appear in your activity
                    feed.
                  </Text>
                </View>
              </View>
              {accountEmail ? (
                <Button
                  variant='outline'
                  onPress={addAccountEmail}
                  disabled={isSaving}
                  accessibilityLabel='Add primary email as a notification method'
                >
                  Add primary email
                </Button>
              ) : null}
            </View>
          ) : (
            <View className='gap-2'>
              {notificationMethods.map(method => {
                const methodKey = method.id ?? `${method.type}-${method.value}`;
                return (
                  <Pressable
                    key={methodKey}
                    onPress={() => setSelectedMethodId(method.id ?? null)}
                    accessibilityRole='button'
                    accessibilityLabel={`Edit ${getMethodLabel(method)} notification preferences`}
                    accessibilityState={{
                      selected: selectedMethod === method,
                    }}
                    className={cn(
                      'flex-row items-center gap-3 rounded-card border bg-card p-4 active:bg-accent/60',
                      selectedMethod === method
                        ? 'border-primary'
                        : 'border-border'
                    )}
                  >
                    <View className='h-10 w-10 items-center justify-center rounded-badge bg-muted'>
                      <Ionicons
                        name={
                          method.type === 'EMAIL'
                            ? 'mail-outline'
                            : method.type === 'PUSH'
                              ? 'phone-portrait-outline'
                              : 'git-network-outline'
                        }
                        size={20}
                        color={
                          selectedMethod === method ? primaryColor : mutedColor
                        }
                      />
                    </View>
                    <View className='flex-1'>
                      <Text className='font-semibold text-foreground'>
                        {getMethodLabel(method)}
                      </Text>
                      <Text
                        className='mt-0.5 text-sm text-muted-foreground'
                        numberOfLines={1}
                      >
                        {getMethodDescription(method)}
                      </Text>
                    </View>
                    <Switch
                      checked={method.enabled}
                      onCheckedChange={enabled => toggleMethod(method, enabled)}
                      disabled={isSaving}
                      accessibilityLabel={`${getMethodLabel(method)} delivery`}
                      accessibilityHint='Turns this notification delivery method on or off'
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {accountEmail && !hasAccountEmailMethod ? (
            <Button
              variant='outline'
              onPress={addAccountEmail}
              disabled={isSaving}
              accessibilityLabel='Add primary email as a notification method'
            >
              Add primary email
            </Button>
          ) : null}
        </View>

        {selectedMethod ? (
          <View className='gap-6'>
            <View>
              <Text className='text-lg font-bold text-foreground'>
                What gets delivered
              </Text>
              <Text className='mt-1 text-sm text-muted-foreground'>
                Preferences below apply to {getMethodLabel(selectedMethod)}.
              </Text>
            </View>

            {NOTIFICATION_CATEGORIES.map(category => (
              <View key={category.title} className='gap-2'>
                <Text className='px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                  {category.title}
                </Text>
                <View className='overflow-hidden rounded-card border border-border bg-card'>
                  {category.items.map((item, index) => (
                    <ToggleRow
                      key={item.type}
                      label={item.label}
                      description={item.description}
                      value={
                        selectedMethod.notifications.find(
                          notification =>
                            notification.notificationType === item.type
                        )?.enabled ?? false
                      }
                      disabled={!selectedMethod.enabled || isSaving}
                      onToggle={value => togglePreference(item.type, value)}
                      showDivider={index < category.items.length - 1}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PushDeviceCard() {
  const { status, permission, errorMessage, enable, openSettings } =
    usePushNotifications();
  const successColor = String(useCSSVariable('--color-success'));
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const isBusy = status === 'checking' || status === 'registering';
  const isRegistered = status === 'registered';
  const needsSettings = permission === 'denied';

  let description =
    errorMessage ??
    'Enable notifications to receive timely event updates on this device.';
  if (status === 'checking') {
    description = 'Checking notification access on this device…';
  } else if (status === 'registering') {
    description = 'Securely registering this device…';
  } else if (isRegistered) {
    description = 'This device is ready to receive Groupi notifications.';
  } else if (status === 'unsupported') {
    description =
      'Use a development or production build to enable remote notifications.';
  } else if (status === 'misconfigured') {
    description = 'This build is missing its native push configuration.';
  } else if (needsSettings) {
    description = 'Notifications are blocked in your device settings.';
  }

  return (
    <View className='gap-3 rounded-card border border-border bg-card p-4'>
      <View className='flex-row items-center gap-3'>
        <View className='h-10 w-10 items-center justify-center rounded-badge bg-muted'>
          <Ionicons
            name={isRegistered ? 'notifications' : 'notifications-outline'}
            size={20}
            color={isRegistered ? successColor : mutedColor}
          />
        </View>
        <View className='flex-1'>
          <Text className='font-semibold text-foreground'>This device</Text>
          <Text
            className='mt-0.5 text-sm text-muted-foreground'
            accessibilityLiveRegion='polite'
          >
            {description}
          </Text>
        </View>
      </View>

      {!isRegistered &&
      status !== 'unsupported' &&
      status !== 'misconfigured' ? (
        <Button
          variant='outline'
          onPress={() => {
            if (needsSettings) {
              void openSettings();
            } else {
              void enable();
            }
          }}
          disabled={isBusy}
          accessibilityLabel={
            needsSettings
              ? 'Open notification settings'
              : 'Enable notifications'
          }
        >
          {isBusy
            ? 'Checking…'
            : needsSettings
              ? 'Open settings'
              : status === 'error'
                ? 'Try again'
                : 'Enable notifications'}
        </Button>
      ) : null}
    </View>
  );
}

function SettingsHeader() {
  return (
    <View className='flex-row items-center px-4 py-3'>
      <BackButton />
      <Text className='text-lg font-semibold text-foreground'>
        Notification settings
      </Text>
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  disabled,
  onToggle,
  showDivider,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onToggle: (value: boolean) => void;
  showDivider: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-4',
        showDivider && 'border-b border-border'
      )}
    >
      <View className='flex-1 pr-4'>
        <Text className='font-medium text-foreground'>{label}</Text>
        <Text className='mt-0.5 text-sm text-muted-foreground'>
          {description}
        </Text>
      </View>
      <Switch
        checked={value}
        onCheckedChange={onToggle}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={description}
      />
    </View>
  );
}
