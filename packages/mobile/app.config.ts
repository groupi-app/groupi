import linkingConfig from './linking.config.json';

const appLinkHost = linkingConfig.appLinkHost;
const easProjectId =
  process.env.EAS_PROJECT_ID?.trim() ||
  process.env.EAS_BUILD_PROJECT_ID?.trim() ||
  '15aeaffd-755c-4f24-96b9-dd9f1bc25e6f';

export default {
  name: 'Groupi',
  slug: 'groupi-mobile',
  owner: 'theiasurette',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'groupi',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain' as const,
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.groupi.mobile',
    associatedDomains: [
      `applinks:${appLinkHost}`,
      `webcredentials:${appLinkHost}`,
    ],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#8200AD',
    },
    package: 'com.groupi.mobile',
    intentFilters: linkingConfig.pathPrefixes.map(pathPrefix => ({
      action: 'VIEW',
      autoVerify: true,
      data: [{ scheme: 'https', host: appLinkHost, pathPrefix }],
      category: ['BROWSABLE', 'DEFAULT'],
    })),
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    'expo-font',
    [
      'expo-notifications',
      {
        defaultChannel: 'default',
        icon: './assets/notification-icon.png',
        color: '#6d28d9',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: easProjectId,
    },
  },
};
