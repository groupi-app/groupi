// @vitest-environment node
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('persistent forms CLI crosses real HTTP into backend with revision and authority enforcement', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('forms-cli-owner');
    const outsider = await bridge.actor('forms-cli-outsider');
    const group = await bridge.cli(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'Forms',
    ]);
    expect(group.code, group.stderr).toBe(0);
    const { groupId } = JSON.parse(group.stdout);
    const run = (args: string[]) =>
      bridge.cli(owner.rawKey, ['groups', 'forms', ...args]);
    const created = await run([
      'create',
      groupId,
      '--title',
      'Survey',
      '--questions-json',
      '[]',
      '--results-visibility',
      'MEMBERS',
    ]);
    expect(created.code, created.stderr).toBe(0);
    const { toolId } = JSON.parse(created.stdout);
    const current = await run(['get', groupId, toolId]);
    expect(current.code, current.stderr).toBe(0);
    expect(JSON.parse(current.stdout)).toMatchObject({
      version: 1,
      responseRevision: 0,
      resultsVisibility: 'MEMBERS',
    });
    expect(
      (
        await bridge.cli(outsider.rawKey, [
          'groups',
          'forms',
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
      '--form-version',
      '1',
      '--expected-revision',
      '0',
      '--answers-json',
      '{}',
    ];
    expect((await run(submit)).code).toBe(0);
    expect((await run(submit)).code).toBe(0);
    const configured = await run([
      'configure',
      groupId,
      toolId,
      '--title',
      'New survey',
      '--form-version',
      '1',
      '--questions-json',
      '[]',
    ]);
    expect(configured.code, configured.stderr).toBe(0);
    expect((await run(submit)).code).toBe(2);
    const history = await run(['history', groupId, toolId, '--limit', '1']);
    expect(history.code, history.stderr).toBe(0);
    expect(JSON.parse(history.stdout).page).toHaveLength(1);
    expect((await run(['delete', groupId, toolId])).code).toBe(2);
    expect((await run(['get', groupId, toolId])).code).toBe(0);
    expect((await run(['remove-own', groupId, toolId, '--yes'])).code).toBe(0);
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
    expect(
      JSON.parse((await run(['policy', 'get', groupId])).stdout)
    ).toMatchObject({ enabled: false, creation: 'MANAGERS' });
    expect((await run(['get', groupId, toolId])).code).toBe(3);
    const disabledSettings = await run(['settings', groupId, toolId]);
    expect(disabledSettings.code, disabledSettings.stderr).toBe(0);
    expect(JSON.parse(disabledSettings.stdout)).toMatchObject({
      version: 2,
      title: 'New survey',
    });
    expect(JSON.parse(disabledSettings.stdout)).not.toHaveProperty('answers');
    expect(
      (
        await run([
          'configure',
          groupId,
          toolId,
          '--title',
          'Preserved settings',
          '--form-version',
          '2',
          '--questions-json',
          '[]',
        ])
      ).code
    ).toBe(0);
    expect(
      JSON.parse((await run(['settings', groupId, toolId])).stdout)
    ).toMatchObject({ version: 3, title: 'Preserved settings' });
    expect((await run(['delete', groupId, toolId, '--yes'])).code).toBe(0);
    expect((await run(['get', groupId, toolId])).code).toBe(4);
  } finally {
    await bridge.close();
  }
}, 60000);
