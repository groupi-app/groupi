import linkingConfig from './linking.config.json';

const appLinkHost = linkingConfig.appLinkHost;
const easProjectId =
  process.env.EAS_PROJECT_ID?.trim() ||
  process.env.EAS_BUILD_PROJECT_ID?.trim() ||
  '15aeaffd-755c-4f24-96b9-dd9f1bc25e6f';
const productionBackedProfiles = new Set([
  'acceptance',
  'production',
  'production-test',
]);

function requireProductionUrl(
  name:
    | 'EXPO_PUBLIC_BASE_URL'
    | 'EXPO_PUBLIC_BETTER_AUTH_URL'
    | 'EXPO_PUBLIC_CONVEX_URL',
  isAllowed: (url: URL) => boolean
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for production-backed mobile builds.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !isAllowed(url)
  ) {
    throw new Error(`${name} is not a valid Groupi production URL.`);
  }
}

if (productionBackedProfiles.has(process.env.EAS_BUILD_PROFILE ?? '')) {
  requireProductionUrl(
    'EXPO_PUBLIC_BASE_URL',
    url =>
      url.origin === `https://${appLinkHost}` &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
  );
  requireProductionUrl(
    'EXPO_PUBLIC_BETTER_AUTH_URL',
    url =>
      url.origin === `https://${appLinkHost}` &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
  );
  requireProductionUrl(
    'EXPO_PUBLIC_CONVEX_URL',
    url =>
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      /^[a-z0-9-]+\.convex\.cloud$/.test(url.hostname)
  );
}

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
