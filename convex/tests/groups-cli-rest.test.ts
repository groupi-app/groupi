// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
// Allow serial CLI process startup and real HTTP operations on hosted runners.
it('CLI creates, pages, renames, clears identity and explicitly deletes owned Groups over HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-group-owner');
    const outsider = await bridge.actor('cli-group-outsider');
    const created = await bridge.cli(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'Readers',
      '--description',
      'Books',
    ]);
    expect(created.code, created.stderr).toBe(0);
    const { groupId } = JSON.parse(created.stdout);
    const list = await bridge.cli(owner.rawKey, [
      'groups',
      'list',
      '--all',
      '--limit',
      '1',
    ]);
    expect(list.code, list.stderr).toBe(0);
    expect(JSON.parse(list.stdout).items[0]).toMatchObject({
      _id: groupId,
      name: 'Readers',
      role: 'OWNER',
    });
    const forbidden = await bridge.cli(outsider.rawKey, [
      'groups',
      'edit',
      groupId,
      '--name',
      'Stolen',
    ]);
    expect(forbidden.code).toBe(3);
    const edited = await bridge.cli(owner.rawKey, [
      'groups',
      'edit',
      groupId,
      '--name',
      'Renamed',
      '--clear-description',
    ]);
    expect(edited.code, edited.stderr).toBe(0);
    const read = await bridge.cli(owner.rawKey, ['groups', 'get', groupId]);
    expect(read.code, read.stderr).toBe(0);
    expect(JSON.parse(read.stdout)).toMatchObject({
      _id: groupId,
      name: 'Renamed',
    });
    expect(JSON.parse(read.stdout).description).toBeUndefined();
    expect(
      (await bridge.cli(owner.rawKey, ['groups', 'delete', groupId])).code
    ).not.toBe(0);
    const deleted = await bridge.cli(owner.rawKey, [
      'groups',
      'delete',
      groupId,
      '--yes',
    ]);
    expect(deleted.code, deleted.stderr).toBe(0);
    expect(
      (await bridge.cli(owner.rawKey, ['groups', 'get', groupId])).code
    ).toBe(4);
  } finally {
    await bridge.close();
  }
}, 30_000);
