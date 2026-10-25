// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';

describe('CLI Event ownership consent through authenticated HTTP', () => {
  it('offers, reports unresolved ownership, accepts as recipient, and refuses replay', async () => {
    const bridge = await cliRestBridge();
    try {
      const owner = await bridge.actor('transfer-cli-owner');
      const recipient = await bridge.actor('transfer-cli-recipient');
      const created = await (
        await owner.request('/events', 'POST', { title: 'Transfer via CLI' })
      ).json();
      const eventId = bridge.wireId(created.eventId);
      const link = await (
        await owner.request(`/events/${created.eventId}/invites`, 'POST', {})
      ).json();
      expect(
        (await recipient.request(`/invites/${link.token}/accept`, 'POST'))
          .status
      ).toBe(200);
      const args = ['events', 'transfer'];
      const unconfirmed = await bridge.cli(owner.rawKey, [
        ...args,
        'offer',
        eventId,
        bridge.wireId(recipient.personId),
      ]);
      expect(unconfirmed.code).toBe(2);
      const offered = await bridge.cli(owner.rawKey, [
        ...args,
        'offer',
        eventId,
        bridge.wireId(recipient.personId),
        '--yes',
      ]);
      expect(offered.code, offered.stderr).toBe(0);
      const pending = JSON.parse(offered.stdout);
      expect(pending.status).toBe('PENDING');
      expect(pending.organizerId).toBe(bridge.wireId(owner.personId));
      const status = await bridge.cli(recipient.rawKey, [
        ...args,
        'status',
        eventId,
      ]);
      expect(status.code, status.stderr).toBe(0);
      expect(JSON.parse(status.stdout).status).toBe('PENDING');
      const impersonated = await bridge.cli(owner.rawKey, [
        ...args,
        'accept',
        eventId,
        pending.transferId,
        '--yes',
      ]);
      expect(impersonated.code).not.toBe(0);
      const accepted = await bridge.cli(recipient.rawKey, [
        ...args,
        'accept',
        eventId,
        pending.transferId,
        '--yes',
      ]);
      expect(accepted.code, accepted.stderr).toBe(0);
      expect(JSON.parse(accepted.stdout).organizerId).toBe(
        bridge.wireId(recipient.personId)
      );
      expect(JSON.parse(accepted.stdout).status).toBe('ACCEPTED');
      const repeated = await bridge.cli(recipient.rawKey, [
        ...args,
        'accept',
        eventId,
        pending.transferId,
        '--yes',
      ]);
      expect(repeated.code).not.toBe(0);
    } finally {
      await bridge.close();
    }
  }, 30000);
});
