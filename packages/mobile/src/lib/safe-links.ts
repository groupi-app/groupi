const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);

export function getSafeExternalUrl(value?: string): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
