import { createHash, randomUUID } from 'node:crypto';
import { CliError } from './errors.js';

/** @typedef {{name: string, apiUrl: string}} CredentialProfile */
/** @typedef {{apiKey: string, expiresAt: number, account: {id: string, name: string, email: string}}} StoredCredential */

function unavailable() {
  return new CliError(
    'CREDENTIAL_STORE_UNAVAILABLE',
    'The OS credential store is unavailable or unreadable. Unlock your keychain or credential manager (Linux requires a running Secret Service), then retry. For headless use, supply GROUPI_API_KEY with GROUPI_API_KEY_PROFILE for a named profile, or --api-key-stdin. Credentials are never saved to a plaintext file.',
    3
  );
}

/** @param {CredentialProfile} profile @param {string} [probe] */
async function entryFor(profile, probe) {
  // Import only when needed: explicit environment/stdin authentication must
  // continue to work when a native binding or desktop secret service is absent.
  const { AsyncEntry } = await import('@napi-rs/keyring');
  const apiUrl = new URL(profile.apiUrl).href.replace(/\/+$/, '');
  const account = createHash('sha256')
    .update(JSON.stringify([profile.name, apiUrl, probe ?? null]))
    .digest('hex');
  return new AsyncEntry('gg.groupi.cli', account, {
    linux: { store: 'secret-service' },
  });
}

/** @param {unknown} value @returns {value is StoredCredential} */
function isCredential(value) {
  if (!value || typeof value !== 'object') return false;
  const record = /** @type {Record<string, unknown>} */ (value);
  const account = /** @type {Record<string, unknown> | undefined} */ (
    record.account
  );
  return (
    typeof record.apiKey === 'string' &&
    record.apiKey.length <= 8192 &&
    /^[\x21-\x7e]+$/.test(record.apiKey) &&
    typeof record.expiresAt === 'number' &&
    Number.isFinite(record.expiresAt) &&
    !!account &&
    typeof account.id === 'string' &&
    account.id.length > 0 &&
    typeof account.name === 'string' &&
    typeof account.email === 'string'
  );
}

/** @param {CredentialProfile} profile @returns {Promise<StoredCredential | undefined>} */
export async function readCredential(profile) {
  try {
    const entry = await entryFor(profile);
    const secret = await entry.getSecret(AbortSignal.timeout(10_000));
    // Some native builds return null although their declarations say undefined.
    if (secret == null) return undefined;
    const credential = JSON.parse(Buffer.from(secret).toString('utf8'));
    if (!isCredential(credential)) throw unavailable();
    return credential;
  } catch {
    throw unavailable();
  }
}

/** @param {CredentialProfile} profile @param {StoredCredential} credential */
export async function saveCredential(profile, credential) {
  try {
    if (!isCredential(credential)) throw unavailable();
    const entry = await entryFor(profile);
    const previous = await entry.getSecret(AbortSignal.timeout(10_000));
    const secret = Buffer.from(JSON.stringify(credential));
    try {
      await entry.setSecret(secret, AbortSignal.timeout(10_000));
      const saved = await entry.getSecret(AbortSignal.timeout(10_000));
      if (!saved || !Buffer.from(saved).equals(secret)) throw unavailable();
    } catch {
      if (previous)
        await entry.setSecret(previous, AbortSignal.timeout(10_000));
      else await entry.deleteCredential(AbortSignal.timeout(10_000));
      throw unavailable();
    }
  } catch {
    throw unavailable();
  }
}

/** @param {CredentialProfile} profile */
export async function deleteCredential(profile) {
  try {
    const entry = await entryFor(profile);
    await entry.deleteCredential(AbortSignal.timeout(10_000));
  } catch {
    throw unavailable();
  }
}

/** @param {CredentialProfile} profile */
export async function checkCredentialStore(profile) {
  try {
    // A disposable entry checks writes without touching the user's saved login.
    const entry = await entryFor(profile, randomUUID());
    const secret = Buffer.from(randomUUID());
    try {
      await entry.setSecret(secret, AbortSignal.timeout(10_000));
      const saved = await entry.getSecret(AbortSignal.timeout(10_000));
      if (!saved || !Buffer.from(saved).equals(secret)) throw unavailable();
    } finally {
      await entry.deleteCredential(AbortSignal.timeout(10_000));
    }
  } catch {
    throw unavailable();
  }
}
