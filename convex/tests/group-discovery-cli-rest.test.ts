// @vitest-environment node
import { it, expect } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('discovers current Group reasons, previews safe logistics and joins Pending through real CLI and authenticated HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-discovery-owner'),
      viewer = await bridge.actor('cli-discovery-viewer');
    async function run(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    }
    const { groupId } = await run(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI Readers',
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
      'Group direct',
    ]);
    await run(owner.rawKey, [
      'events',
      'settings',
      'set',
      eventId,
      '--admission-policy',
      'DIRECT',
    ]);
    await run(owner.rawKey, ['events', 'share-group', eventId, groupId]);
    expect(
      (
        await run(viewer.rawKey, [
          'events',
          'discover',
          '--all',
          '--limit',
          '1',
        ])
      ).items
    ).toEqual([
      expect.objectContaining({
        id: eventId,
        entryAction: 'JOIN',
        accessReasons: {
          friends: false,
          groups: [{ groupId, name: 'CLI Readers' }],
        },
      }),
    ]);
    const preview = await run(viewer.rawKey, ['events', 'preview', eventId]);
    expect(preview.entryAction).toBe('JOIN');
    expect(preview).not.toHaveProperty('members');
    expect(await run(viewer.rawKey, ['events', 'join', eventId])).toMatchObject(
      { joined: true, role: 'ATTENDEE', rsvpStatus: 'PENDING' }
    );
    expect(
      (await run(viewer.rawKey, ['events', 'discover', '--all'])).items
    ).toEqual([]);
    await run(owner.rawKey, [
      'events',
      'unshare-group',
      eventId,
      groupId,
      '--yes',
    ]);
    expect(
      (await run(viewer.rawKey, ['events', 'preview', eventId])).entryAction
    ).toBe('MEMBER');
  } finally {
    await bridge.close();
  }
});
