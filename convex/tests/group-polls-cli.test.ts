// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
// Allow serial CLI process startup and real HTTP operations on hosted runners.
it('poll CLI crosses real localhost HTTP into persistent voting, configuration, results, removal and disabled manager recovery', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('poll-cli-owner'),
      outsider = await bridge.actor('poll-cli-outsider');
    const group = await bridge.cli(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI polls',
    ]);
    expect(group.code, group.stderr).toBe(0);
    const { groupId } = JSON.parse(group.stdout);
    const run = (args: string[]) =>
      bridge.cli(owner.rawKey, ['groups', 'polls', ...args]);
    const opts = '[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}]';
    const created = await run([
      'create',
      groupId,
      '--title',
      'Vote',
      '--mode',
      'SINGLE',
      '--options-json',
      opts,
      '--results-visibility',
      'MEMBERS',
    ]);
    expect(created.code, created.stderr).toBe(0);
    const { toolId } = JSON.parse(created.stdout);
    const current = await run(['get', groupId, toolId]);
    expect(current.code, current.stderr).toBe(0);
    expect(JSON.parse(current.stdout)).toMatchObject({
      version: 1,
      voteRevision: 0,
      mode: 'SINGLE',
      resultsVisibility: 'MEMBERS',
    });
    expect(
      (
        await bridge.cli(outsider.rawKey, [
          'groups',
          'polls',
          'get',
          groupId,
          toolId,
        ])
      ).code
    ).toBe(3);
    const submit = [
      'submit',
      groupId,
      toolId,
      '--poll-version',
      '1',
      '--expected-revision',
      '0',
      '--selections-json',
      '["yes"]',
    ];
    expect(JSON.parse((await run(submit)).stdout)).toEqual({ revision: 1 });
    expect(JSON.parse((await run(submit)).stdout)).toEqual({ revision: 1 });
    expect(
      JSON.parse((await run(['results', groupId, toolId])).stdout).page[0]
    ).toMatchObject({ selections: ['yes'], isCurrent: true });
    const configured = await run([
      'configure',
      groupId,
      toolId,
      '--title',
      'Updated',
      '--mode',
      'MULTIPLE',
      '--poll-version',
      '1',
      '--options-json',
      opts,
    ]);
    expect(configured.code, configured.stderr).toBe(0);
    expect((await run(submit)).code).toBe(2);
    expect(
      JSON.parse((await run(['get', groupId, toolId])).stdout)
    ).toMatchObject({ semanticVersion: 2, selections: [], voteRevision: 1 });
    expect(
      JSON.parse((await run(['results', groupId, toolId])).stdout).page[0]
        .isCurrent
    ).toBe(false);
    const history = await run(['history', groupId, toolId, '--limit', '1']);
    expect(history.code, history.stderr).toBe(0);
    expect(JSON.parse(history.stdout).page[0]).toMatchObject({
      mode: 'SINGLE',
      selections: ['yes'],
    });
    expect(
      (
        await run([
          'remove-own',
          groupId,
          toolId,
          '--expected-revision',
          '0',
          '--yes',
        ])
      ).code
    ).toBe(2);
    expect(
      (await run(['remove-own', groupId, toolId, '--expected-revision', '1']))
        .code
    ).toBe(2);
    expect(
      (
        await run([
          'remove-own',
          groupId,
          toolId,
          '--expected-revision',
          '1',
          '--yes',
        ])
      ).code
    ).toBe(0);
    expect(
      JSON.parse((await run(['history', groupId, toolId])).stdout).page
    ).toEqual([]);
    expect(
      (
        await run([
          'policy',
          'set',
          groupId,
          '--enabled',
          'false',
          '--creation',
          'MANAGERS',
        ])
      ).code
    ).toBe(0);
    expect((await run(['get', groupId, toolId])).code).toBe(3);
    expect((await run(['settings', groupId, toolId])).code).toBe(0);
    expect(JSON.parse((await run(['list', groupId])).stdout).page).toHaveLength(
      1
    );
    expect((await run(['delete', groupId, toolId, '--yes'])).code).toBe(0);
  } finally {
    await bridge.close();
  }
}, 30_000);
