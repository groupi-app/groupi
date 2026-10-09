// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI enumerates all ownership, confirms explicit resource deletion, and deletes only after final guard over authenticated HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-resolution-owner');
    const created = await (
      await owner.request('/events', 'POST', { title: 'Resolve me' })
    ).json();
    const group = await (
      await owner.request('/groups', 'POST', { name: 'Resolve Group' })
    ).json();
    const listed = await bridge.cli(owner.rawKey, [
      'account',
      'responsibilities',
      '--all',
      '--kind',
      'EVENT',
      '--limit',
      '1',
    ]);
    expect(listed.code, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).items[0]).toMatchObject({
      title: 'Resolve me',
      resolved: false,
      status: 'NONE',
    });
    const denied = await bridge.cli(owner.rawKey, [
      'account',
      'delete',
      '--confirm-username',
      'cli-resolution-owner',
      '--yes',
    ]);
    expect(denied.code).not.toBe(0);
    expect(denied.stderr).toContain('Resolve owned Groups');
    const deletedGroup = await bridge.cli(owner.rawKey, [
      'groups',
      'delete',
      bridge.wireId(group.groupId),
      '--yes',
    ]);
    expect(deletedGroup.code, deletedGroup.stderr).toBe(0);
    const unconfirmed = await bridge.cli(owner.rawKey, [
      'account',
      'delete-event',
      bridge.wireId(created.eventId),
    ]);
    expect(unconfirmed.code).toBe(2);
    const deletedEvent = await bridge.cli(owner.rawKey, [
      'account',
      'delete-event',
      bridge.wireId(created.eventId),
      '--yes',
    ]);
    expect(deletedEvent.code, deletedEvent.stderr).toBe(0);
    const ready = await bridge.cli(owner.rawKey, ['account', 'readiness']);
    expect(ready.code, ready.stderr).toBe(0);
    expect(JSON.parse(ready.stdout).canDelete).toBe(true);
    const deleted = await bridge.cli(owner.rawKey, [
      'account',
      'delete',
      '--confirm-username',
      'cli-resolution-owner',
      '--yes',
    ]);
    expect(deleted.code, deleted.stderr).toBe(0);
    expect(JSON.parse(deleted.stdout)).toEqual({ success: true });
    expect((await owner.request('/account/readiness', 'GET')).status).toBe(401);
  } finally {
    await bridge.close();
  }
}, 30000);
