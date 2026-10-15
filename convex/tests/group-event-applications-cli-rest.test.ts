// @vitest-environment node
import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';

it('real CLI applies through Group HTTP eligibility and recovers own records after stale approval is denied', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('group-app-cli-owner');
    const applicant = await bridge.actor('group-app-cli-author');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'CLI applicants' }
    );
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: applicant.personId }
    );
    await applicant.auth.mutation(
      api.groupInvites.mutations.acceptGroupInvite,
      { inviteId: invite.inviteId }
    );
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'CLI Group applications', visibility: 'PRIVATE' }
    );
    await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
      eventId,
      admissionPolicy: 'APPLY',
    });
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    );
    async function run(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    }
    const wireEvent = bridge.wireId(eventId);
    expect(
      await run(applicant.rawKey, ['events', 'preview', wireEvent])
    ).toMatchObject({ entryAction: 'APPLY' });
    const request = await run(applicant.rawKey, [
      'events',
      'applications',
      'submit',
      wireEvent,
      '--answers',
      '{}',
    ]);
    await applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId,
    });
    const denied = await bridge.cli(owner.rawKey, [
      'events',
      'applications',
      'approve',
      request.applicationId,
    ]);
    expect(denied.code).not.toBe(0);
    expect(denied.stderr).toContain('current audience eligibility');
    expect(
      await run(applicant.rawKey, ['events', 'applications', 'form', wireEvent])
    ).toMatchObject({
      settings: null,
      canApply: false,
      pending: { status: 'PENDING' },
    });
    expect(
      await run(applicant.rawKey, [
        'events',
        'applications',
        'history',
        wireEvent,
      ])
    ).toMatchObject({ page: [{ status: 'PENDING' }] });
    const repeatInvite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: applicant.personId }
    );
    await applicant.auth.mutation(
      api.groupInvites.mutations.acceptGroupInvite,
      { inviteId: repeatInvite.inviteId }
    );
    expect(
      await run(owner.rawKey, [
        'events',
        'applications',
        'approve',
        request.applicationId,
      ])
    ).toMatchObject({ status: 'APPROVED' });
    expect(
      await applicant.auth.query(api.events.queries.getEventHeader, { eventId })
    ).toMatchObject({
      userMembership: { role: 'ATTENDEE', rsvpStatus: 'PENDING' },
    });
  } finally {
    await bridge.close();
  }
}, 30000);
