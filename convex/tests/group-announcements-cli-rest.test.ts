// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI explicitly sends and recovers truthful aggregate status over real local HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-ann-owner');
    const outsider = await bridge.actor('cli-ann-outsider');
    const created = await bridge.cli(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'Readers',
    ]);
    expect(created.code, created.stderr).toBe(0);
    const { groupId } = JSON.parse(created.stdout);
    const requestId = `${Date.now()}.12345678-1234-4123-8123-123456789abc`;
    const args = [
      'groups',
      'announce',
      groupId,
      '--title',
      'Reading',
      '--message',
      'Bring a book',
      '--request-id',
      requestId,
    ];
    expect((await bridge.cli(outsider.rawKey, args)).code).toBe(3);
    const first = await bridge.cli(owner.rawKey, args);
    expect(first.code, first.stderr).toBe(0);
    expect(JSON.parse(first.stdout)).toMatchObject({
      state: expect.stringMatching(/PROCESSING|COMPLETED/),
      notified: 0,
    });
    const recovered = await bridge.cli(owner.rawKey, args);
    expect(recovered.code, recovered.stderr).toBe(0);
    expect(JSON.parse(recovered.stdout).announcementId).toBe(
      JSON.parse(first.stdout).announcementId
    );
    const status = await bridge.cli(owner.rawKey, [
      'groups',
      'announcement-status',
      groupId,
      '--request-id',
      requestId,
    ]);
    expect(status.code, status.stderr).toBe(0);
    expect(Object.keys(JSON.parse(status.stdout)).sort()).toEqual([
      'announcementId',
      'notified',
      'skipped',
      'state',
    ]);
    const changed = await bridge.cli(owner.rawKey, [
      ...args.slice(0, 6),
      'Changed',
      ...args.slice(7),
    ]);
    expect(changed.code).not.toBe(0);
  } finally {
    await bridge.close();
  }
});
