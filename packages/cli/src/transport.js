import { setTimeout as delay } from 'node:timers/promises';
import { CliError } from './errors.js';

/** @param {number} status */
function responseError(status) {
  if (status === 400 || status === 422)
    return new CliError(
      'USAGE',
      'The server rejected the request. Check inputs; for pagination, restart without a cursor.',
      2
    );
  if (status === 401)
    return new CliError(
      'AUTH_REQUIRED',
      'The key is invalid, expired, disabled, or revoked. Explicitly obtain a new key for this profile.',
      3
    );
  if (status === 403)
    return new CliError(
      'FORBIDDEN',
      'This identity or API key cannot access the requested resource.',
      3
    );
  if (status === 404)
    return new CliError(
      'NOT_FOUND',
      'The requested resource or API endpoint was not found.',
      4
    );
  if (status === 429)
    return new CliError(
      'RATE_LIMITED',
      'The server rate limit was reached. Wait before repeating the read.',
      5
    );
  return new CliError(
    'REMOTE_ERROR',
    `The server could not complete the read (HTTP ${status}).`,
    5
  );
}

/** @param {string | null} value @param {number} attempt */
function retryDelay(value, attempt) {
  if (value !== null) {
    const seconds = Number(value);
    const milliseconds = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(value) - Date.now();
    if (Number.isFinite(milliseconds)) return Math.max(0, milliseconds);
  }
  return 250 * 2 ** attempt;
}

/** Read-only transport. Authentication never follows redirects, including same-host redirects.
 * @param {{apiUrl: string}} profile @param {string} key @param {string} path
 * @returns {Promise<unknown>}
 */
export async function readApi(profile, key, path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(profile.apiUrl + path, {
        headers: { 'x-api-key': key, accept: 'application/json' },
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        throw new CliError(
          'UNSAFE_REDIRECT',
          'Authenticated redirects are refused. Verify the profile API URL.',
          5
        );
      }
      if (!response.ok) {
        if (response.status === 403) {
          const problem = await response.json().catch(() => null);
          if (problem?.error?.code === 'ONBOARDING_REQUIRED')
            throw new CliError(
              'ONBOARDING_REQUIRED',
              'Complete required Group onboarding with groups questionnaire get/submit before reading member content.',
              3
            );
        } else await response.body?.cancel();
        if (
          attempt < 2 &&
          (response.status === 429 || [502, 503, 504].includes(response.status))
        ) {
          const wait = retryDelay(response.headers.get('retry-after'), attempt);
          if (wait > 2000) throw responseError(response.status);
          await delay(wait);
          continue;
        }
        throw responseError(response.status);
      }
      try {
        return await response.json();
      } catch {
        throw new CliError(
          'INVALID_RESPONSE',
          'The server returned invalid JSON. Verify the profile API URL.',
          5
        );
      }
    } catch (error) {
      if (error instanceof CliError) throw error;
      if (attempt < 2) {
        await delay(retryDelay(null, attempt));
        continue;
      }
      throw new CliError(
        'NETWORK_ERROR',
        'The server could not be reached after three attempts. Check your connection and profile URL.',
        5
      );
    }
  }
  throw new CliError('NETWORK_ERROR', 'The read could not complete.', 5);
}
