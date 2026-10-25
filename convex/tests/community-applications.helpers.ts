import { api } from '../_generated/api';
import {
  setup,
  authorize,
  token,
  exchange,
} from './delegated-protocol.helpers';
import type { AuthorizationAction } from '../authorization/model';
import { createAuthAccount } from './auth.helpers';
export async function applicant(
  actions: readonly AuthorizationAction[] = [
    'groups.context.read',
    'groups.applications.submit',
    'groups.applications.edit',
    'groups.applications.withdraw',
  ] as const
) {
  const f = await setup();
  const staff = await createAuthAccount(f.t, 'application-staff');
  const groupId = await staff.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Community',
  });
  await staff.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    {
      groupId,
      applicationsEnabled: true,
      questions: [
        {
          id: 'welcome',
          label: 'Welcome?',
          required: true,
          type: 'LONG_ANSWER',
        },
      ],
    }
  );
  const result = await authorize(f, {
    scopes: `openid ${actions.join(' ')}`,
    actions: [...actions],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const request = (
    path: string,
    method = 'GET',
    body?: unknown,
    operationId = crypto.randomUUID()
  ) =>
    f.t.fetch(`/api/v2/groups/${groupId}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': operationId,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const read = async () => (await request('community-context')).json();
  return {
    ...f,
    staff,
    groupId,
    request,
    read,
    accessToken: tokens.access_token as string,
  };
}
