interface PasskeyConfigInput {
  androidOrigins?: string;
  siteUrl?: string;
  rpId?: string;
  rpName?: string;
}

export interface PasskeyConfig {
  origin: string | string[];
  rpID: string;
  rpName: string;
  siteOrigin: string;
}

const ANDROID_ORIGIN_PREFIX = 'android:apk-key-hash:';
const URL_SAFE_SHA256_BASE64 = /^[A-Za-z0-9_-]{43}$/;

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveAndroidOrigins(value?: string): string[] {
  if (!value?.trim()) {
    return [];
  }

  const origins = value.split(',').map(origin => origin.trim());
  if (origins.some(origin => !origin)) {
    throw new Error(
      'PASSKEY_ANDROID_ORIGINS must be a comma-separated list without empty entries'
    );
  }

  for (const origin of origins) {
    const digest = origin.startsWith(ANDROID_ORIGIN_PREFIX)
      ? origin.slice(ANDROID_ORIGIN_PREFIX.length)
      : '';
    if (!digest || !URL_SAFE_SHA256_BASE64.test(digest)) {
      throw new Error(
        'PASSKEY_ANDROID_ORIGINS entries must use android:apk-key-hash:<BASE64URL_SHA256>'
      );
    }
  }

  return [...new Set(origins)];
}

export function resolvePasskeyConfig({
  androidOrigins,
  siteUrl,
  rpId,
  rpName,
}: PasskeyConfigInput): PasskeyConfig {
  if (!siteUrl?.trim()) {
    throw new Error('SITE_URL is required to configure passkeys');
  }

  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error('SITE_URL must be a valid absolute URL');
  }

  if (url.protocol !== 'https:' && !isLocalHostname(url.hostname)) {
    throw new Error('SITE_URL must use HTTPS outside local development');
  }

  const resolvedRpId = rpId?.trim() || url.hostname;
  if (
    resolvedRpId.includes('://') ||
    resolvedRpId.includes('/') ||
    resolvedRpId.includes(':')
  ) {
    throw new Error(
      'PASSKEY_RP_ID must be a hostname without a scheme or port'
    );
  }

  if (
    url.hostname !== resolvedRpId &&
    !url.hostname.endsWith(`.${resolvedRpId}`)
  ) {
    throw new Error('PASSKEY_RP_ID must match SITE_URL or its parent domain');
  }

  const resolvedAndroidOrigins = resolveAndroidOrigins(androidOrigins);
  const siteOrigin = url.origin;

  return {
    origin:
      resolvedAndroidOrigins.length > 0
        ? [siteOrigin, ...resolvedAndroidOrigins]
        : siteOrigin,
    rpID: resolvedRpId,
    rpName: rpName?.trim() || 'Groupi',
    siteOrigin,
  };
}
