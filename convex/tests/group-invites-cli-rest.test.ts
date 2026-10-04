// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI sends invitations, changes Group privacy/policy and admits only the intended recipient over HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-invites-owner');
    const recipient = await bridge.actor('cli-invites-recipient');
    const outsider = await bridge.actor('cli-invites-outsider');
    async function run(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    }
    const { groupId } = await run(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI Group',
    ]);
    const recipientId = bridge.wireId(recipient.personId);
    await run(recipient.rawKey, [
      'settings',
      'privacy',
      'set',
      '--group-invites',
      'NO_ONE',
    ]);
    expect(
      (
        await bridge.cli(owner.rawKey, [
          'groups',
          'invite',
          groupId,
          recipientId,
        ])
      ).code
    ).not.toBe(0);
    await run(recipient.rawKey, [
      'settings',
      'privacy',
      'set',
      '--group-invites',
      'EVERYONE',
    ]);
    const sent = await run(owner.rawKey, [
      'groups',
      'invite',
      groupId,
      recipientId,
    ]);
    const repeated = await run(owner.rawKey, [
      'groups',
      'invite',
      groupId,
      recipientId,
    ]);
    expect(repeated).toEqual(sent);
    const inbox = await run(recipient.rawKey, [
      'group-invites',
      'list',
      '--all',
      '--limit',
      '1',
      '--status',
      'PENDING',
    ]);
    expect(inbox.items).toMatchObject([
      { inviteId: sent.inviteId, status: 'PENDING', group: { groupId } },
    ]);
    expect(JSON.stringify(inbox)).not.toContain('@example.com');
    expect(
      (
        await bridge.cli(outsider.rawKey, [
          'group-invites',
          'accept',
          sent.inviteId,
        ])
      ).code
    ).toBe(3);
    expect(
      (await bridge.cli(recipient.rawKey, ['groups', 'members', groupId])).code
    ).toBe(3);
    await run(owner.rawKey, [
      'groups',
      'invitation-policy',
      groupId,
      '--enabled',
      'false',
    ]);
    expect(
      (
        await bridge.cli(recipient.rawKey, [
          'group-invites',
          'accept',
          sent.inviteId,
        ])
      ).code
    ).not.toBe(0);
    await run(owner.rawKey, [
      'groups',
      'invitation-policy',
      groupId,
      '--enabled',
      'true',
    ]);
    const admitted = await run(recipient.rawKey, [
      'group-invites',
      'accept',
      sent.inviteId,
    ]);
    expect(admitted.status).toBe('ACCEPTED');
    expect(
      await run(recipient.rawKey, ['group-invites', 'accept', sent.inviteId])
    ).toEqual(admitted);
    const roster = await run(recipient.rawKey, [
      'groups',
      'members',
      groupId,
      '--all',
      '--limit',
      '1',
    ]);
    expect(roster.items).toHaveLength(2);
    expect(roster.items[1]).toMatchObject({
      personId: recipientId,
      role: 'MEMBER',
    });
    expect(JSON.stringify(roster)).not.toContain('@example.com');
    expect(
      (
        await run(owner.rawKey, [
          'groups',
          'invites',
          groupId,
          '--status',
          'ACCEPTED',
        ])
      ).items
    ).toMatchObject([{ inviteId: sent.inviteId, status: 'ACCEPTED' }]);
    const next = await run(owner.rawKey, [
      'groups',
      'invite',
      groupId,
      bridge.wireId(outsider.personId),
    ]);
    expect(
      (
        await bridge.cli(outsider.rawKey, [
          'group-invites',
          'decline',
          next.inviteId,
        ])
      ).code
    ).not.toBe(0);
    await run(outsider.rawKey, [
      'group-invites',
      'decline',
      next.inviteId,
      '--yes',
    ]);
    expect(
      (
        await bridge.cli(outsider.rawKey, [
          'group-invites',
          'accept',
          next.inviteId,
        ])
      ).code
    ).not.toBe(0);
    const third = await run(owner.rawKey, [
      'groups',
      'invite',
      groupId,
      bridge.wireId(outsider.personId),
    ]);
    await run(owner.rawKey, [
      'group-invites',
      'cancel',
      third.inviteId,
      '--yes',
    ]);
  } finally {
    await bridge.close();
  }
});
