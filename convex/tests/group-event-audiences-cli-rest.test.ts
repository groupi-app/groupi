// @vitest-environment node
import { it, expect } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
// Allow serial CLI process startup and real HTTP operations on hosted runners.
it('shares and withdraws a read-only whole-Group audience over actual CLI and authenticated HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-audience-owner'),
      viewer = await bridge.actor('cli-audience-viewer');
    async function run(key: string, args: string[]) {
      const r = await bridge.cli(key, args);
      expect(r.code, r.stderr).toBe(0);
      return JSON.parse(r.stdout);
    }
    const { groupId } = await run(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI shared Events',
    ]);
    const { inviteId } = await run(owner.rawKey, [
      'groups',
      'invite',
      groupId,
      bridge.wireId(viewer.personId),
    ]);
    await run(viewer.rawKey, ['group-invites', 'accept', inviteId]);
    const { eventId } = await run(owner.rawKey, [
      'events',
      'create',
      '--title',
      'Independent CLI Event',
      '--location',
      'Library',
    ]);
    await run(owner.rawKey, [
      'groups',
      'event-sharing',
      groupId,
      '--policy',
      'MANAGERS',
    ]);
    expect(
      await run(owner.rawKey, ['events', 'share-group', eventId, groupId])
    ).toMatchObject({ shared: true });
    expect(
      (
        await run(viewer.rawKey, [
          'groups',
          'events',
          groupId,
          '--all',
          '--limit',
          '1',
        ])
      ).items[0]
    ).toMatchObject({
      event: {
        _id: eventId,
        title: 'Independent CLI Event',
        location: 'Library',
      },
      canWithdraw: false,
    });
    expect(
      await run(viewer.rawKey, ['events', 'preview', eventId])
    ).toMatchObject({ entryAction: 'INVITATION_ONLY' });
    const denied = await bridge.cli(viewer.rawKey, [
      'events',
      'share-group',
      eventId,
      groupId,
    ]);
    expect(denied.code).not.toBe(0);
    expect(
      await run(owner.rawKey, ['events', 'audiences', eventId])
    ).toMatchObject({ groups: [{ groupId, canWithdraw: true }] });
    await run(owner.rawKey, [
      'events',
      'friends-audience',
      eventId,
      '--enabled',
      'true',
    ]);
    await run(owner.rawKey, [
      'groups',
      'withdraw-event',
      groupId,
      eventId,
      '--yes',
    ]);
    expect(
      (await run(viewer.rawKey, ['groups', 'events', groupId, '--all'])).items
    ).toEqual([]);
    expect(
      (await bridge.cli(viewer.rawKey, ['events', 'preview', eventId])).code
    ).not.toBe(0);
  } finally {
    await bridge.close();
  }
}, 30_000);
