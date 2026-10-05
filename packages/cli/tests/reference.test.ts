import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const executable = process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js');
const packageRoot = resolve(executable, '../..');

test('distributed versioned reference stays current with executable command definitions', () => {
  const result = spawnSync(
    process.execPath,
    [resolve(packageRoot, 'scripts/generate-reference.js'), '--check'],
    {
      encoding: 'utf8',
      env: { ...process.env, GROUPI_PROFILE: 'unrelated-profile' },
    }
  );
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  const reference = JSON.parse(
    readFileSync(resolve(packageRoot, 'docs/command-reference.json'), 'utf8')
  );
  const version = spawnSync(process.execPath, [executable, '--version'], {
    encoding: 'utf8',
  });
  expect(reference.version).toBe(version.stdout.trim());
  expect(
    reference.commands.some(
      (command: { path: string }) => command.path === 'groupi events create'
    )
  ).toBe(true);
  expect(
    reference.commands.some(
      (command: { path: string }) =>
        command.path === 'groupi invite-lists create'
    )
  ).toBe(true);
});

test('distributed agent examples execute planning, inspection and recipient-accepted ownership transfer without secret output', async () => {
  const { createServer } = await import('node:http');
  const { spawn } = await import('node:child_process');
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { randomUUID } = await import('node:crypto');
  const directory = await mkdtemp(resolve(tmpdir(), 'groupi-guidance-'));
  let accepted = false;
  let response = 'PENDING';
  let transferStatus = 'NONE';
  let organizerId = 'organizer';
  const unexpected: string[] = [];
  const server = createServer((request, reply) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
    });
    request.on('end', () => {
      const path = new URL(request.url!, 'http://local').pathname;
      const identity =
        request.headers['x-api-key'] === 'synthetic-organizer'
          ? 'organizer'
          : 'attendee';
      const rsvp = {
        membershipId: 'membership-1',
        rsvpStatus: response,
        rsvpNote: null,
      };
      const inviteListPerson = {
        personId: 'attendee-1',
        name: 'Guest',
        username: 'guest',
        image: null,
        available: true,
      };
      const inviteList = {
        inviteListId: 'list-1',
        name: 'Dinner guests',
        personCount: 1,
        availablePersonCount: 1,
        needsAttention: false,
        createdAt: 1,
        updatedAt: 1,
      };
      let data: unknown;
      if (path === '/api/v2/health')
        data = {
          capabilities: {
            eventWrites: { version: 1 },
            eventCreationIdempotency: { version: 1, retentionMs: 86400000 },
            inviteWrites: { version: 1, retentionMs: 86400000 },
            attendanceWrites: { version: 1 },
            eventTransfers: { version: 1 },
            inviteLists: { version: 2, retentionMs: 86400000 },
          },
        };
      else if (path === '/api/v2/invite-lists/people/search')
        data = { items: [inviteListPerson] };
      else if (path === '/api/v2/invite-lists' && request.method === 'POST')
        data = { ...inviteList, people: [inviteListPerson] };
      else if (path === '/api/v2/invite-lists') data = { items: [inviteList] };
      else if (
        path === '/api/v2/invite-lists/list-1' &&
        request.method === 'PATCH'
      )
        data = {
          ...inviteList,
          name: JSON.parse(body).name,
          people: [inviteListPerson],
        };
      else if (
        path === '/api/v2/invite-lists/list-1' &&
        request.method === 'DELETE'
      )
        data = { deleted: true, inviteListId: 'list-1' };
      else if (path === '/api/v2/invite-lists/list-1')
        data = { ...inviteList, people: [inviteListPerson] };
      else if (path === '/api/v2/invite-lists/list-1/invite-to-event')
        data = {
          eventId: 'event-1',
          totalCount: 1,
          sentCount: 0,
          skippedCount: 1,
          results: [
            {
              personId: 'attendee-1',
              status: 'skipped',
              reason: 'INVITATION_PENDING',
            },
          ],
        };
      else if (path === '/api/v2/profile')
        data = {
          userId: identity,
          name: identity,
          email: `${identity}@example.com`,
        };
      else if (path === '/api/v2/events' && request.method === 'POST')
        data = { eventId: 'event-1', membershipId: 'organizer-membership' };
      else if (
        path === '/api/v2/events/event-1/ownership-transfer' ||
        path === '/api/v2/events/event-1/ownership-transfer/accept'
      ) {
        if (request.method === 'POST') {
          const input = JSON.parse(body);
          if (path.endsWith('/accept')) {
            if (identity !== 'attendee' || input.transferId !== 'transfer-1')
              unexpected.push('Invalid recipient ownership acceptance');
            transferStatus = 'ACCEPTED';
            organizerId = 'attendee-1';
          } else {
            if (identity !== 'organizer' || input.recipientId !== 'attendee-1')
              unexpected.push('Invalid ownership offer');
            transferStatus = 'PENDING';
          }
        }
        data = {
          eventId: 'event-1',
          createdById: 'organizer',
          organizerId,
          status: transferStatus,
          transferId: transferStatus === 'NONE' ? null : 'transfer-1',
          recipientId: transferStatus === 'NONE' ? null : 'attendee-1',
          offeredById: transferStatus === 'NONE' ? null : 'organizer',
          explanation:
            'Ownership remains unresolved until recipient acceptance.',
        };
      } else if (path === '/api/v2/events/event-1/member-invites')
        data = { inviteId: 'invite-1', status: 'PENDING' };
      else if (path === '/api/v2/member-invites/invite-1')
        data = {
          inviteId: 'invite-1',
          eventId: 'event-1',
          eventTitle: 'Dinner',
          inviterId: 'organizer',
          inviteeId: 'attendee',
          role: 'ATTENDEE',
          status: 'PENDING',
          message: null,
          createdAt: 1,
          respondedAt: null,
        };
      else if (path === '/api/v2/member-invites/invite-1/accept') {
        accepted = true;
        data = { eventId: 'event-1', membershipId: 'membership-1' };
      } else if (path === '/api/v2/events/event-1/rsvp') {
        if (request.method === 'PATCH') response = JSON.parse(body).rsvpStatus;
        data = { ...rsvp, rsvpStatus: response };
      } else if (path === '/api/v2/events/event-1/members')
        data = {
          items: [
            {
              id: 'membership-1',
              personId: 'attendee-1',
              role: 'ATTENDEE',
              rsvpStatus: response,
              rsvpNote: null,
              joinedAt: 1,
              user: null,
            },
          ],
          nextCursor: null,
        };
      else if (path === '/api/v2/events')
        data = {
          items: [{ id: 'event-1', title: 'Dinner' }],
          nextCursor: null,
        };
      else if (path === '/api/v2/events/event-1')
        data = { id: 'event-1', title: 'Dinner' };
      else {
        unexpected.push(`${request.method} ${path}`);
        reply.writeHead(404);
        data = {};
      }
      reply.setHeader('content-type', 'application/json');
      reply.end(JSON.stringify(data));
    });
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No fixture port');
  const apiUrl = `http://127.0.0.1:${address.port}/api/v2`;
  async function invoke(args: string[], identity = 'organizer') {
    return await new Promise<{
      code: number | null;
      stdout: string;
      stderr: string;
    }>((done, reject) => {
      const child = spawn(process.execPath, [executable, ...args], {
        env: {
          ...process.env,
          GROUPI_CONFIG_DIR: directory,
          GROUPI_PROFILE: '',
          GROUPI_API_KEY: `synthetic-${identity}`,
          GROUPI_API_KEY_PROFILE: identity,
        },
        stdio: 'pipe',
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => {
        stdout += chunk;
      });
      child.stderr.on('data', chunk => {
        stderr += chunk;
      });
      child.on('error', reject);
      child.on('close', code => done({ code, stdout, stderr }));
      child.stdin.end();
    });
  }
  try {
    for (const identity of ['organizer', 'attendee'])
      expect(
        (await invoke(['profile', 'add', identity, '--api-url', apiUrl])).code
      ).toBe(0);
    const substitutions: Record<string, string> = {
      $EVENT_REQUEST_ID: `${Date.now()}.${randomUUID()}`,
      $INVITE_REQUEST_ID: `${Date.now()}.${randomUUID()}`,
      $INVITE_LIST_REQUEST_ID: `${Date.now()}.${randomUUID()}`,
      $ATTENDEE_USERNAME: 'guest',
    };
    const workflows = JSON.parse(
      readFileSync(resolve(packageRoot, 'docs/agent-workflows.json'), 'utf8')
    ) as Record<string, { identity: string; args: string[] }[]>;
    for (const step of Object.values(workflows).flat()) {
      const args = step.args.map(
        argument => substitutions[argument] ?? argument
      );
      const result = await invoke(
        ['--profile', step.identity, ...args],
        step.identity
      );
      expect(result.stderr).toBe('');
      expect(result.code).toBe(0);
      expect(result.stdout).not.toContain('synthetic-');
      const data = JSON.parse(result.stdout);
      if (data.eventId) substitutions.$EVENT_ID = data.eventId;
      if (data.inviteId) substitutions.$INVITE_ID = data.inviteId;
      if (data.transferId) substitutions.$TRANSFER_ID = data.transferId;
      if (data.inviteListId) substitutions.$INVITE_LIST_ID = data.inviteListId;
      if (step.args[0] === 'invite-lists' && step.args[1] === 'people')
        substitutions.$INVITE_LIST_PERSON_IDS = JSON.stringify(
          data.items.map((person: { personId: string }) => person.personId)
        );
      if (step.args[0] === 'events' && step.args[1] === 'members') {
        expect(data.items[0].rsvpStatus).toBe('YES');
        substitutions.$RECIPIENT_PERSON_ID = data.items[0].personId;
      }
      if (step.args[0] === 'invite-lists' && step.args[1] === 'invite') {
        expect(data.sentCount).toBe(0);
        expect(data.skippedCount).toBe(1);
        expect(data.requestId).toBe(substitutions.$INVITE_LIST_REQUEST_ID);
      }
      if (step.args[0] === 'invite-lists' && step.args[1] === 'delete')
        expect(data.deleted).toBe(true);
    }
    expect(accepted).toBe(true);
    expect(response).toBe('YES');
    expect(transferStatus).toBe('ACCEPTED');
    expect(organizerId).toBe('attendee-1');
    expect(unexpected).toEqual([]);
  } finally {
    await new Promise<void>(done => server.close(() => done()));
    await rm(directory, { recursive: true, force: true });
  }
});

test('portable agent JSON instructions produce actionable errors without interactive login', () => {
  const result = spawnSync(
    process.execPath,
    [executable, 'auth', 'login', '--format', 'json'],
    {
      encoding: 'utf8',
      input: '',
      env: {
        ...process.env,
        GROUPI_API_KEY: 'synthetic-secret-never-print',
        GROUPI_PROFILE: '',
      },
    }
  );
  expect(result.status).toBe(3);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe(
    'BROWSER_INTERACTION_REQUIRED'
  );
  expect(result.stderr).not.toContain('synthetic-secret-never-print');
});
