import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkCredentialStore,
  deleteCredential,
  readCredential,
  saveCredential,
} from '../src/credential-store.js';

const profile = {
  name: `store-test-${randomUUID()}`,
  apiUrl: 'https://store-test.invalid/api/v2',
};
const credential = {
  apiKey: randomUUID(),
  expiresAt: Date.now() + 60_000,
  account: {
    id: 'store-test',
    name: 'Store test',
    email: 'test@example.invalid',
  },
};
const otherEndpoint = { ...profile, apiUrl: 'https://other.invalid/api/v2' };
const otherName = { ...profile, name: `${profile.name}-other` };
const configuration = await mkdtemp(join(tmpdir(), 'groupi-store-test-'));
process.env.GROUPI_CONFIG_DIR = configuration;

if (process.argv.includes('--unavailable')) {
  try {
    for (const operation of [
      () => checkCredentialStore(profile),
      () => readCredential(profile),
      () => saveCredential(profile, credential),
      () => deleteCredential(profile),
    ]) {
      await assert.rejects(operation, error => {
        const failure =
          /** @type {Error & {code?: string, exitCode?: number}} */ (error);
        assert.equal(failure.code, 'CREDENTIAL_STORE_UNAVAILABLE');
        assert.equal(failure.exitCode, 3);
        assert(failure.message.includes('--api-key-stdin'));
        assert(failure.message.includes('GROUPI_API_KEY'));
        assert(!failure.message.includes(credential.apiKey));
        assert(!failure.message.includes(credential.account.email));
        return true;
      });
    }
    assert.equal((await readdir(configuration)).length, 0);
    process.stdout.write('Unavailable credential store fails safely.\n');
  } finally {
    await rm(configuration, { recursive: true, force: true });
  }
} else {
  await verifyAvailableStore();
}

async function verifyAvailableStore() {
  try {
    await checkCredentialStore(profile);
    assert(
      (await readCredential(profile)) === undefined,
      'Entry starts absent'
    );
    await saveCredential(profile, credential);
    const saved = await readCredential(profile);
    assert(
      JSON.stringify(saved) === JSON.stringify(credential),
      'Credential round trip preserves the complete record'
    );
    await checkCredentialStore(profile);
    assert(
      (await readCredential(profile))?.apiKey === credential.apiKey,
      'Availability checks preserve existing credentials'
    );
    assert(
      (await readCredential(otherEndpoint)) === undefined,
      'A different deployment cannot read the credential'
    );
    assert(
      (await readCredential(otherName)) === undefined,
      'A different named profile cannot read the credential'
    );
    assert(
      (await readCredential({ ...profile, apiUrl: `${profile.apiUrl}/` }))
        ?.apiKey === credential.apiKey,
      'Canonical endpoint spelling retains the profile'
    );
    await saveCredential(otherEndpoint, {
      ...credential,
      apiKey: randomUUID(),
    });
    await deleteCredential(otherEndpoint);
    assert(
      (await readCredential(profile))?.apiKey === credential.apiKey,
      'Deleting another deployment leaves the selected profile intact'
    );
    await deleteCredential(profile);
    assert((await readCredential(profile)) === undefined, 'Entry is removed');
    await deleteCredential(profile);
    assert.equal((await readdir(configuration)).length, 0);
    process.stdout.write(
      'Native credential store round trip and isolation passed.\n'
    );
  } finally {
    try {
      await deleteCredential(profile);
      await deleteCredential(otherEndpoint);
    } finally {
      await rm(configuration, { recursive: true, force: true });
    }
  }
}
