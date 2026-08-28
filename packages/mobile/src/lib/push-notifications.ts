import Constants, { AppOwnership } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PUSH_DEVICE_ID_KEY = 'groupi.push-device-id';
const DEFAULT_CHANNEL_ID = 'default';

export type PushPermissionState = 'granted' | 'undetermined' | 'denied';

export interface PushRegistration {
  token: string;
  deviceId: string;
  projectId: string;
  appId: string;
  platform: 'ios' | 'android';
}

function getExtraProjectId(extra: unknown) {
  if (!extra || typeof extra !== 'object') return null;
  const eas = Reflect.get(extra, 'eas');
  if (!eas || typeof eas !== 'object') return null;
  const projectId = Reflect.get(eas, 'projectId');
  return typeof projectId === 'string' && projectId.length > 0
    ? projectId
    : null;
}

export function getPushProjectId() {
  return (
    getExtraProjectId(Constants.expoConfig?.extra) ??
    Constants.easConfig?.projectId ??
    null
  );
}

export function getPushAppId() {
  if (Platform.OS === 'ios') {
    return Constants.expoConfig?.ios?.bundleIdentifier;
  }
  if (Platform.OS === 'android') {
    return Constants.expoConfig?.android?.package;
  }
  return undefined;
}

function createInstallIdentifier() {
  const randomPart = () => Math.random().toString(36).slice(2, 12);
  return `install-${Date.now().toString(36)}-${randomPart()}-${randomPart()}`;
}

export async function getOrCreatePushDeviceId() {
  const existing = await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = createInstallIdentifier();
  await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Groupi notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6d28d9',
    showBadge: true,
  });
}

export async function getPushPermissionState(): Promise<PushPermissionState> {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) return 'granted';
  return permissions.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPushPermission() {
  await ensureAndroidNotificationChannel();
  const permissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  if (permissions.granted) return 'granted' as const;
  return permissions.canAskAgain
    ? ('undetermined' as const)
    : ('denied' as const);
}

export function isPushSupportedInThisClient() {
  return Platform.OS !== 'web' && Constants.appOwnership !== AppOwnership.Expo;
}

export async function registerForPushNotifications(): Promise<PushRegistration> {
  if (!isPushSupportedInThisClient()) {
    throw new Error(
      'Remote push notifications require a development or production build.'
    );
  }

  const platform = Platform.OS;
  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('Push notifications are not supported on this platform.');
  }

  const projectId = getPushProjectId();
  if (!projectId) {
    throw new Error('This build is missing its EAS project ID.');
  }
  const appId = getPushAppId();
  if (!appId) {
    throw new Error('This build is missing its native application identifier.');
  }

  await ensureAndroidNotificationChannel();
  const permission = await getPushPermissionState();
  if (permission !== 'granted') {
    throw new Error('Notification permission has not been granted.');
  }

  const [{ data: token }, deviceId] = await Promise.all([
    Notifications.getExpoPushTokenAsync({ projectId }),
    getOrCreatePushDeviceId(),
  ]);

  return {
    token,
    deviceId,
    projectId,
    appId,
    platform,
  };
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

export function getPushNotificationId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const notificationId = Reflect.get(data, 'notificationId');
  return isSafeId(notificationId) ? notificationId : null;
}

/**
 * Converts server-controlled notification data into a small allowlist of
 * native routes. Raw URLs are deliberately never followed.
 */
export function getPushNotificationDestination(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;

  const destination = Reflect.get(data, 'destination');
  if (destination === 'notifications') return '/notifications';
  if (destination === 'invites') return '/invites';
  if (destination === 'friends') return '/friends';

  if (destination === 'event') {
    const eventId = Reflect.get(data, 'eventId');
    if (!isSafeId(eventId)) return null;
    return `/event/${eventId}`;
  }

  if (destination === 'post') {
    const eventId = Reflect.get(data, 'eventId');
    const postId = Reflect.get(data, 'postId');
    if (!isSafeId(eventId) || !isSafeId(postId)) return null;
    return `/event/${eventId}/post/${postId}`;
  }

  return null;
}

export function configureForegroundNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
