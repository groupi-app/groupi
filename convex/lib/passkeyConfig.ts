interface PasskeyConfigInput {
  siteUrl?: string;
  rpId?: string;
  rpName?: string;
}

export interface PasskeyConfig {
  origin: string;
  rpID: string;
  rpName: string;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function resolvePasskeyConfig({
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

  return {
    origin: url.origin,
    rpID: resolvedRpId,
    rpName: rpName?.trim() || 'Groupi',
  };
}
