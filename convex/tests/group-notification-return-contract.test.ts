import { expect, it } from 'vitest';
import { api, internal } from '../_generated/api';
import {
  listNotifications,
  listNotificationsPage,
} from '../notifications/rest';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

it('declares every projected Group notification field in both REST query return contracts', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'notification-contract-owner');
  const recipient = await createAuthAccount(
    t,
    'notification-contract-recipient'
  );
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Notification contract',
  });
  const { inviteId } = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: recipient.personId }
  );
  const legacy = await t.query(internal.notifications.rest.listNotifications, {
    personId: recipient.personId,
  });
  const page = await t.query(
    internal.notifications.rest.listNotificationsPage,
    { personId: recipient.personId, unreadOnly: false, limit: 20, cursor: null }
  );
  expect(legacy).toMatchObject([
    {
      type: 'GROUP_INVITE_RECEIVED',
      group: { id: groupId },
      groupInvite: { id: inviteId, status: 'PENDING' },
      groupAnnouncement: null,
      author: { user: { email: null } },
    },
  ]);
  expect(page).toMatchObject({ items: legacy });

  // convex-test validates arguments and stored documents, but not function
  // returns. Check the real projection against both deployed return contracts:
  // Convex rejects even a null extra field, turning the REST response into 500.
  const legacyReturn = JSON.parse(listNotifications.exportReturns());
  const pageReturn = JSON.parse(listNotificationsPage.exportReturns());
  const itemContracts = [
    legacyReturn.value.value,
    pageReturn.value.find(
      (variant: { type: string; value: Record<string, unknown> }) =>
        variant.type === 'object' && 'items' in variant.value
    ).value.items.fieldType.value.value,
  ];
  for (const fields of itemContracts) {
    expect(Object.keys(legacy[0]).filter(key => !(key in fields))).toEqual([]);
    expect(fields.groupAnnouncement).toMatchObject({
      optional: true,
      fieldType: {
        type: 'union',
        value: expect.arrayContaining([
          { type: 'null' },
          {
            type: 'object',
            value: {
              title: { fieldType: { type: 'string' }, optional: false },
              message: { fieldType: { type: 'string' }, optional: false },
            },
          },
        ]),
      },
    });
  }
});
