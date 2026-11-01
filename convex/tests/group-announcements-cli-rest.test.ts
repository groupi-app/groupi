// @vitest-environment node
import { expect, it } from 'vitest';
import { seedGroupAnnouncement } from './announcement-history.helpers';
import { cliRestBridge } from './cli-rest-bridge.helpers';
// Allow serial CLI process startup and real HTTP operations on hosted runners.
it('CLI rejects retired sends and retains historical aggregate status over real local HTTP', async () => {
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
    const outsiderSend = await bridge.cli(outsider.rawKey, args);
    expect(outsiderSend.code).toBe(5);
    expect(JSON.parse(outsiderSend.stderr).error).toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('Announcements are retired'),
    });
    const receiptsBefore = await bridge.t.run(ctx =>
      ctx.db.query('groupAnnouncements').collect()
    );
    const first = await bridge.cli(owner.rawKey, args);
    expect(first.code).toBe(5);
    expect(JSON.parse(first.stderr).error).toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('Announcements are retired'),
    });
    expect(
      await bridge.t.run(ctx => ctx.db.query('groupAnnouncements').collect())
    ).toEqual(receiptsBefore);
    const historical = await seedGroupAnnouncement(
      bridge.t,
      owner.personId,
      {
        groupId: bridge.id<'groups'>(groupId),
        requestId,
        title: 'Reading',
        message: 'Bring a book',
      },
      false
    );
    const recovered = await bridge.cli(owner.rawKey, args);
    expect(recovered.code).toBe(5);
    expect(JSON.parse(recovered.stderr).error).toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('Announcements are retired'),
    });
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
    expect(JSON.parse(status.stdout).announcementId).toBe(
      bridge.wireId(historical.announcementId)
    );
    const changed = await bridge.cli(owner.rawKey, [
      ...args.slice(0, 6),
      'Changed',
      ...args.slice(7),
    ]);
    expect(changed.code).not.toBe(0);
  } finally {
    await bridge.close();
  }
}, 30_000);
