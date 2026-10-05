// @vitest-environment node
import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';
it('CLI requires onboarding after immediate admission, recovers content, retains former records and disables without deleting private data', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('q-cli-owner'),
      member = await bridge.actor('q-cli-member');
    async function success(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    }
    const { groupId } = await success(owner.rawKey, [
      'groups',
      'create',
      '--name',
      'Readers',
    ]);
    const questions = JSON.stringify([
      {
        id: 'book',
        label: 'Favorite book',
        required: true,
        type: 'SHORT_ANSWER',
      },
    ]);
    await success(owner.rawKey, [
      'groups',
      'questionnaire',
      'configure',
      groupId,
      '--enabled',
      'true',
      '--questions',
      questions,
      '--required-completion',
      'true',
    ]);
    const sent = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      {
        groupId: bridge.id<'groups'>(groupId),
        inviteePersonId: member.personId,
      }
    );
    expect(
      await success(member.rawKey, ['group-invites', 'accept', sent.inviteId])
    ).toMatchObject({
      joiningQuestionnaire: {
        enabled: true,
        requiredCompletion: true,
        requiresCompletion: true,
        canAccessMemberContent: false,
        completed: false,
        shouldPrompt: true,
      },
    });
    const blocked = await bridge.cli(member.rawKey, [
      'groups',
      'members',
      groupId,
    ]);
    expect(blocked.code).not.toBe(0);
    expect(blocked.stderr).toContain('ONBOARDING_REQUIRED');
    const form = await success(member.rawKey, [
      'groups',
      'questionnaire',
      'get',
      groupId,
    ]);
    expect(
      await success(member.rawKey, [
        'groups',
        'questionnaire',
        'submit',
        groupId,
        '--form-version',
        String(form.version),
        '--answers',
        '{"book":"Dune"}',
      ])
    ).toMatchObject({ completed: true, answers: { book: 'Dune' } });
    expect(
      (await success(member.rawKey, ['groups', 'members', groupId])).items
    ).toHaveLength(2);
    await success(member.rawKey, [
      'groups',
      'questionnaire',
      'submit',
      groupId,
      '--form-version',
      String(form.version),
      '--answers',
      '{"book":"Foundation"}',
    ]);
    await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId: bridge.id<'groups'>(groupId),
    });
    expect(
      await success(member.rawKey, ['groups', 'questionnaire', 'get', groupId])
    ).toMatchObject({ canEdit: false, answers: { book: 'Foundation' } });
    expect(
      (
        await success(member.rawKey, [
          'groups',
          'questionnaire',
          'history',
          groupId,
          '--limit',
          '1',
        ])
      ).items[0]
    ).toMatchObject({
      answer: 'Foundation',
      question: { label: 'Favorite book' },
    });
    expect(
      await success(owner.rawKey, [
        'groups',
        'questionnaire',
        'configure',
        groupId,
        '--enabled',
        'false',
        '--questions',
        questions,
      ])
    ).toMatchObject({ enabled: false });
    expect(
      await success(member.rawKey, [
        'groups',
        'questionnaire',
        'status',
        groupId,
      ])
    ).toMatchObject({ enabled: false, shouldPrompt: false, completed: true });
  } finally {
    await bridge.close();
  }
}, 30000);
