import linkingConfig from '../../linking.config.json';

const DEFAULT_PUBLIC_BASE_URL = linkingConfig.publicBaseUrl;
export const PUBLIC_APP_LINK_HOST = linkingConfig.appLinkHost;
export const APP_LINK_PATH_PREFIXES = linkingConfig.pathPrefixes;

export function getPublicBaseUrl(value = process.env.EXPO_PUBLIC_BASE_URL) {
  if (!value) return DEFAULT_PUBLIC_BASE_URL;

  try {
    const url = new URL(value);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return DEFAULT_PUBLIC_BASE_URL;
    }
    if (url.protocol === 'https:' && url.hostname === 'groupi.gg') {
      return DEFAULT_PUBLIC_BASE_URL;
    }
    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_BASE_URL;
  }
}

export function getPublicInviteUrl(token: string) {
  return `${getPublicBaseUrl()}/invite/${encodeURIComponent(token)}`;
}

export function getPublicGdlUrl() {
  return `${getPublicBaseUrl()}/gdl`;
}

export function getPublicEventAddonUrl(eventId: string, addonType: string) {
  return `${getPublicBaseUrl()}/event/${encodeURIComponent(eventId)}/addon/${encodeURIComponent(addonType)}`;
}
