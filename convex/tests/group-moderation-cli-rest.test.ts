// @vitest-environment node
import { it, expect } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI manages roles, exclusions, private bans and own leave through authenticated HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-mod-owner');
    const mod = await bridge.actor('cli-mod-manager');
    const member = await bridge.actor('cli-mod-member');
    async function run(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    }
    const { groupId } = await run(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI moderation',
    ]);
    for (const p of [mod, member]) {
      const offer = await run(owner.rawKey, [
        'groups',
        'invite',
        groupId,
        bridge.wireId(p.personId),
      ]);
      await run(p.rawKey, ['group-invites', 'accept', offer.inviteId]);
    }
    const modId = bridge.wireId(mod.personId),
      personId = bridge.wireId(member.personId);
    expect(
      await run(owner.rawKey, [
        'groups',
        'member-role',
        groupId,
        modId,
        '--role',
        'MODERATOR',
        '--yes',
      ])
    ).toEqual({ role: 'MODERATOR' });
    expect(
      (
        await bridge.cli(mod.rawKey, [
          'groups',
          'member-role',
          groupId,
          personId,
          '--role',
          'MODERATOR',
          '--yes',
        ])
      ).code
    ).not.toBe(0);
    expect(
      (
        await bridge.cli(mod.rawKey, [
          'groups',
          'remove-member',
          groupId,
          personId,
        ])
      ).code
    ).not.toBe(0);
    expect(
      await run(mod.rawKey, ['groups', 'ban', groupId, personId, '--yes'])
    ).toEqual({ banned: true });
    expect(
      await run(mod.rawKey, ['groups', 'ban', groupId, personId, '--yes'])
    ).toEqual({ banned: true });
    expect(
      (
        await run(mod.rawKey, [
          'groups',
          'bans',
          groupId,
          '--all',
          '--limit',
          '1',
        ])
      ).items
    ).toMatchObject([{ personId, username: 'cli-mod-member' }]);
    expect(
      (await bridge.cli(member.rawKey, ['groups', 'bans', groupId])).code
    ).not.toBe(0);
    await run(mod.rawKey, ['groups', 'lift-ban', groupId, personId, '--yes']);
    const invite = await run(mod.rawKey, [
      'groups',
      'invite',
      groupId,
      personId,
    ]);
    await run(member.rawKey, ['group-invites', 'accept', invite.inviteId]);
    expect(
      await run(mod.rawKey, [
        'groups',
        'remove-member',
        groupId,
        personId,
        '--yes',
      ])
    ).toEqual({ removed: true });
    expect(
      await run(mod.rawKey, ['groups', 'leave', groupId, '--yes'])
    ).toEqual({ left: true });
    expect(
      (await bridge.cli(owner.rawKey, ['groups', 'leave', groupId, '--yes']))
        .code
    ).not.toBe(0);
  } finally {
    await bridge.close();
  }
});
