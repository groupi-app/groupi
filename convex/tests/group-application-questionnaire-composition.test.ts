import { it, expect } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
it('application approval immediately admits and prompts an optional questionnaire without re-admission on terminal replay', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'composition-owner');
  const applicant = await createAuthAccount(t, 'composition-applicant');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Composition',
  });
  await owner.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    { groupId, applicationsEnabled: true, questions: [] }
  );
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      questions: [
        {
          id: 'book',
          label: 'Favorite book',
          required: true,
          type: 'SHORT_ANSWER',
        },
      ],
    }
  );
  const { applicationId } = await applicant.auth.mutation(
    api.groupApplications.mutations.submitGroupApplication,
    { groupId, answers: {} }
  );
  const review = () =>
    owner.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId, decision: 'APPROVED' }
    );
  expect(await review()).toMatchObject({
    status: 'APPROVED',
    joiningQuestionnaire: {
      enabled: true,
      completed: false,
      shouldPrompt: true,
    },
  });
  expect(
    await applicant.auth.query(api.groups.queries.getGroup, { groupId })
  ).toMatchObject({ viewerRole: 'MEMBER', memberCount: 2 });
  const form = await applicant.auth.query(
    api.groupQuestionnaires.queries.getJoiningQuestionnaire,
    { groupId }
  );
  await applicant.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId, version: form.version, answers: { book: 'Dune' } }
  );
  expect(await review()).toMatchObject({
    joiningQuestionnaire: { completed: true, shouldPrompt: false },
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: false,
      questions: [
        {
          id: 'book',
          label: 'Favorite book',
          required: true,
          type: 'SHORT_ANSWER',
        },
      ],
    }
  );
  expect(await review()).toMatchObject({
    joiningQuestionnaire: {
      enabled: false,
      completed: true,
      shouldPrompt: false,
    },
  });
  await applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId,
  });
  expect(await review()).toEqual({ applicationId, status: 'APPROVED' });
  expect(
    await applicant.auth.query(api.groups.queries.getGroup, { groupId })
  ).toBeNull();
});
it('composes racing invitation and application entry once and omits prompts on banned or departed replay without records', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'race-composition-owner');
  const applicant = await createAuthAccount(t, 'race-composition-applicant');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Race composition',
  });
  await owner.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    { groupId, applicationsEnabled: true, questions: [] }
  );
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: false, questions: [] }
  );
  const { applicationId } = await applicant.auth.mutation(
    api.groupApplications.mutations.submitGroupApplication,
    { groupId, answers: {} }
  );
  const { inviteId } = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: applicant.personId }
  );
  const review = () =>
    owner.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId, decision: 'APPROVED' }
    );
  const [approved] = await Promise.all([
    review(),
    applicant.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId,
    }),
  ]);
  expect(approved).toMatchObject({
    joiningQuestionnaire: { enabled: false, shouldPrompt: false },
  });
  expect(
    await owner.auth.query(api.groups.queries.getGroup, { groupId })
  ).toMatchObject({ memberCount: 2 });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: applicant.personId,
  });
  expect(await review()).toEqual({ applicationId, status: 'APPROVED' });
  expect(
    await owner.auth.query(api.groups.queries.getGroup, { groupId })
  ).toMatchObject({ memberCount: 1 });
});
