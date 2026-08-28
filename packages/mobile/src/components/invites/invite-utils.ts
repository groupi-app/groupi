export const INVITE_EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
] as const;

export type InviteExpiry = (typeof INVITE_EXPIRY_OPTIONS)[number]['value'];

const EXPIRY_DURATION_MS: Record<Exclude<InviteExpiry, 'never'>, number> = {
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getInviteExpiryTimestamp(
  expiry: InviteExpiry,
  now = Date.now()
) {
  return expiry === 'never' ? undefined : now + EXPIRY_DURATION_MS[expiry];
}

export function validateMaxUses(
  value: string
):
  | { value: undefined; error: null }
  | { value: number; error: null }
  | { value: undefined; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: undefined, error: null };

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999_999) {
    return {
      value: undefined,
      error: 'Enter a whole number from 1 to 999,999.',
    };
  }

  return { value: parsed, error: null };
}

export function parseEmailRecipients(value: string) {
  const candidates = value
    .split(/[\s,;]+/)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(candidates)];

  return {
    valid: unique.filter(email => EMAIL_PATTERN.test(email)),
    invalid: unique.filter(email => !EMAIL_PATTERN.test(email)),
  };
}

export function formatInviteDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

export function describeInviteExpiry(expiresAt?: number, now = Date.now()) {
  if (!expiresAt) return 'Never expires';
  if (expiresAt <= now) return 'Expired';
  return `Expires ${formatInviteDate(expiresAt)}`;
}
