const DEFAULT_PUBLIC_BASE_URL = 'https://groupi.gg';

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
    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_BASE_URL;
  }
}

export function getPublicInviteUrl(token: string) {
  return `${getPublicBaseUrl()}/invite/${encodeURIComponent(token)}`;
}
