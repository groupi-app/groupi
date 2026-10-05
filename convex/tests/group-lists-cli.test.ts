// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('list CLI crosses real localhost HTTP with exact requests, revision removal and disabled management', async () => {
  const b = await cliRestBridge();
  try {
    const owner = await b.actor('lists-cli-owner');
    const outsider = await b.actor('lists-cli-outsider');
    const g = await b.cli(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'Lists',
    ]);
    expect(g.code, g.stderr).toBe(0);
    const { groupId } = JSON.parse(g.stdout);
    const run = (args: string[]) =>
      b.cli(owner.rawKey, ['groups', 'lists', ...args]);
    const made = await run([
      'create',
      groupId,
      '--title',
      'Reading',
      '--results-visibility',
      'MEMBERS',
    ]);
    expect(made.code, made.stderr).toBe(0);
    const { toolId } = JSON.parse(made.stdout);
    const add = [
      'add',
      groupId,
      toolId,
      '--list-version',
      '1',
      '--text',
      'Kindred',
      '--request-id',
      `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
    ];
    const first = await run(add);
    expect(first.code, first.stderr).toBe(0);
    const result = JSON.parse(first.stdout);
    expect(JSON.parse((await run(add)).stdout)).toEqual(result);
    const edit = await run([
      'edit',
      groupId,
      toolId,
      result.entryId,
      '--list-version',
      '1',
      '--expected-revision',
      '1',
      '--text',
      'Kindred',
      '--completed',
      'true',
    ]);
    expect(edit.code, edit.stderr).toBe(0);
    expect(
      (
        await run([
          'remove',
          groupId,
          toolId,
          result.entryId,
          '--expected-revision',
          '1',
          '--yes',
        ])
      ).code
    ).not.toBe(0);
    const removed = await run([
      'remove',
      groupId,
      toolId,
      result.entryId,
      '--expected-revision',
      '2',
      '--yes',
    ]);
    expect(removed.code, removed.stderr).toBe(0);
    expect(JSON.parse((await run(add)).stdout).state).toBe('REMOVED');
    expect(
      (
        await b.cli(outsider.rawKey, [
          'groups',
          'lists',
          'get',
          groupId,
          toolId,
        ])
      ).code
    ).toBe(3);
    const disabled = await run([
      'policy',
      'set',
      groupId,
      '--enabled',
      'false',
      '--creation',
      'MANAGERS',
    ]);
    expect(disabled.code, disabled.stderr).toBe(0);
    expect((await run(['get', groupId, toolId])).code).toBe(3);
    expect((await run(['settings', groupId, toolId])).code).toBe(0);
    expect((await run(['delete', groupId, toolId, '--yes'])).code).toBe(0);
  } finally {
    await b.close();
  }
}, 30000);
