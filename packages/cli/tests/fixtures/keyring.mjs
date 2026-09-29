import process from 'node:process';
import { Buffer } from 'node:buffer';
const entries = new Map();
export class AsyncEntry {
  constructor(service, account) {
    this.id = JSON.stringify([service, account]);
  }
  async getSecret() {
    return entries.has(this.id)
      ? entries.get(this.id)
      : process.env.TEST_SAVED_CREDENTIAL
        ? Buffer.from(process.env.TEST_SAVED_CREDENTIAL)
        : undefined;
  }
  async setSecret(value) {
    if (
      process.env.TEST_STORE_FAILURE &&
      Buffer.from(value).toString().includes('fresh-secret')
    )
      throw new Error('native error containing fresh-secret');
    entries.set(this.id, value);
  }
  async deleteCredential() {
    const present = entries.has(this.id) || !!process.env.TEST_SAVED_CREDENTIAL;
    entries.set(this.id, undefined);
    return present;
  }
}
