// @vitest-environment node
import { it, expect } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI configures questions and edits, reviews and retains private Group applications over HTTP', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-app-owner');
    const person = await bridge.actor('cli-app-person');
    const stranger = await bridge.actor('cli-app-stranger');
    async function run(key: string, args: string[]) {
      const response = await bridge.cli(key, args);
      expect(response.code, response.stderr).toBe(0);
      return JSON.parse(response.stdout);
    }
    const { groupId } = await run(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'CLI applications',
    ]);
    await run(owner.rawKey, [
      'groups',
      'questionnaire',
      'configure',
      groupId,
      '--enabled',
      'true',
      '--required-completion',
      'true',
      '--questions',
      JSON.stringify([
        {
          id: 'book',
          label: 'Favorite book',
          required: true,
          type: 'SHORT_ANSWER',
        },
      ]),
    ]);
    const question = JSON.stringify([
      { id: 'why', label: 'Why?', type: 'SHORT_ANSWER', required: true },
    ]);
    await run(owner.rawKey, [
      'groups',
      'application-settings',
      groupId,
      '--enabled',
      'true',
      '--questions',
      question,
    ]);
    expect(
      await run(person.rawKey, ['groups', 'application-form', groupId])
    ).toMatchObject({ applicationsEnabled: true, canApply: true });
    const submitted = await run(person.rawKey, [
      'groups',
      'apply',
      groupId,
      '--answers',
      '{"why":"First"}',
    ]);
    await run(person.rawKey, [
      'groups',
      'application-edit',
      groupId,
      submitted.applicationId,
      '--answers',
      '{"why":"Edited"}',
    ]);
    expect(
      (
        await bridge.cli(stranger.rawKey, [
          'groups',
          'application-get',
          groupId,
          submitted.applicationId,
        ])
      ).code
    ).not.toBe(0);
    expect(
      (
        await run(owner.rawKey, [
          'groups',
          'applications',
          groupId,
          '--status',
          'PENDING',
          '--all',
          '--limit',
          '1',
        ])
      ).items[0]
    ).toMatchObject({ answers: { why: 'Edited' } });
    await run(owner.rawKey, [
      'groups',
      'application-review',
      groupId,
      submitted.applicationId,
      '--decision',
      'DECLINED',
      '--yes',
    ]);
    const second = await run(person.rawKey, [
      'groups',
      'apply',
      groupId,
      '--answers',
      '{"why":"Second"}',
    ]);
    await run(person.rawKey, [
      'groups',
      'application-withdraw',
      groupId,
      second.applicationId,
      '--yes',
    ]);
    const third = await run(person.rawKey, [
      'groups',
      'apply',
      groupId,
      '--answers',
      '{"why":"Third"}',
    ]);
    const approved = await run(owner.rawKey, [
      'groups',
      'application-review',
      groupId,
      third.applicationId,
      '--decision',
      'APPROVED',
      '--yes',
    ]);
    expect(approved).toMatchObject({
      joiningQuestionnaire: {
        enabled: true,
        requiredCompletion: true,
        requiresCompletion: true,
        canAccessMemberContent: false,
        completed: false,
        shouldPrompt: true,
      },
    });
    const denied = await bridge.cli(person.rawKey, [
      'groups',
      'members',
      groupId,
    ]);
    expect(denied.code).not.toBe(0);
    expect(denied.stderr).toContain('ONBOARDING_REQUIRED');
    const form = await run(person.rawKey, [
      'groups',
      'questionnaire',
      'get',
      groupId,
    ]);
    await run(person.rawKey, [
      'groups',
      'questionnaire',
      'submit',
      groupId,
      '--form-version',
      String(form.version),
      '--answers',
      '{"book":"Dune"}',
    ]);
    expect(
      (await run(person.rawKey, ['groups', 'members', groupId])).items
    ).toHaveLength(2);
    await run(owner.rawKey, [
      'groups',
      'application-review',
      groupId,
      third.applicationId,
      '--decision',
      'APPROVED',
      '--yes',
    ]);
    expect(await run(owner.rawKey, ['groups', 'get', groupId])).toMatchObject({
      memberCount: 2,
    });
    await run(person.rawKey, ['groups', 'leave', groupId, '--yes']);
    expect(
      await run(owner.rawKey, [
        'groups',
        'application-review',
        groupId,
        third.applicationId,
        '--decision',
        'APPROVED',
        '--yes',
      ])
    ).toEqual({ applicationId: third.applicationId, status: 'APPROVED' });
    expect(await run(owner.rawKey, ['groups', 'get', groupId])).toMatchObject({
      memberCount: 1,
    });
    expect(
      (
        await run(person.rawKey, [
          'groups',
          'application-history',
          groupId,
          '--all',
          '--limit',
          '1',
        ])
      ).items.map((a: { status: string }) => a.status)
    ).toEqual(['APPROVED', 'WITHDRAWN', 'DECLINED']);
  } finally {
    await bridge.close();
  }
});
