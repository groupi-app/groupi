interface PasskeyErrorLike {
  code?: unknown;
  message?: unknown;
}

function asPasskeyError(error: unknown): PasskeyErrorLike | null {
  return error && typeof error === 'object'
    ? (error as PasskeyErrorLike)
    : null;
}

export function isSessionNotFreshError(error: unknown): boolean {
  const candidate = asPasskeyError(error);
  if (!candidate) return false;

  return (
    candidate.code === 'SESSION_NOT_FRESH' ||
    (typeof candidate.message === 'string' &&
      candidate.message.toLowerCase().includes('session is not fresh'))
  );
}

export function isPasskeyCancellation(error: unknown): boolean {
  const candidate = asPasskeyError(error);
  const message =
    typeof candidate?.message === 'string'
      ? candidate.message.toLowerCase()
      : error instanceof Error
        ? error.message.toLowerCase()
        : '';

  return (
    message.includes('cancel') ||
    message.includes('abort') ||
    message.includes('user dismissed')
  );
}

export function getPasskeyErrorMessage(
  error: unknown,
  fallback: string
): string {
  const candidate = asPasskeyError(error);
  const message =
    typeof candidate?.message === 'string'
      ? candidate.message.trim()
      : error instanceof Error
        ? error.message.trim()
        : '';

  if (
    message.includes('FAKETEAMID') &&
    message.toLowerCase().includes('webcredentials association')
  ) {
    return 'Passkeys aren’t available in this simulator build. Try a signed Groupi build on a physical device.';
  }

  if (
    message.toLowerCase().includes('webcredentials association') ||
    message.toLowerCase().includes('not associated with this app')
  ) {
    return "This Groupi build isn't registered for passkeys yet. Install the latest signed build and try again.";
  }

  return message || fallback;
}
