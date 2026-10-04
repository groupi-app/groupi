import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from 'node:http';
import { afterEach, beforeEach, expect, test } from 'vitest';

let config: string;
const servers: Server[] = [];
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-attendance-'));
});
afterEach(async () => {
  for (const server of servers.splice(0))
    await new Promise<void>(done => server.close(() => done()));
  await rm(config, { recursive: true, force: true });
});
async function endpoint(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  capability = true,
  pendingRsvpJoin = true,
  eventAdmission = true
) {
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/v2/health') {
      res.end(
        JSON.stringify({
          capabilities: capability
            ? {
                ...(eventAdmission ? { eventAdmission: { version: 1 } } : {}),
                eventManagement: {
                  version: 1,
                  ...(pendingRsvpJoin ? { pendingRsvpJoin: true } : {}),
                },
              }
            : {},
        })
      );
    } else handler(req, res);
  });
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No port');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
}
function cli(args: string[], json = true) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (done, reject) => {
      const child = spawn(
        process.execPath,
        [
          process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
          '--profile',
          'test',
          ...(json ? ['--format', 'json'] : []),
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: 'private-test-key',
            GROUPI_API_KEY_PROFILE: 'test',
          },
          stdio: 'pipe',
        }
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', data => (stdout += data));
      child.stderr.on('data', data => (stderr += data));
      child.on('error', reject);
      child.on('close', code => done({ code, stdout, stderr }));
      child.stdin.end();
    }
  );
}

test('delete names its event target and requires explicit headless confirmation', async () => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(`${req.method} ${req.url}`);
    res.statusCode = 204;
    res.end();
  });
  const declined = await cli(['events', 'delete', 'event-1']);
  expect(declined.code).toBe(2);
  expect(JSON.parse(declined.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toEqual([]);
  const deleted = await cli(['events', 'delete', 'event-1', '--yes']);
  expect(deleted.code).toBe(0);
  expect(JSON.parse(deleted.stdout)).toEqual({
    eventId: 'event-1',
    deleted: true,
  });
  expect(writes).toEqual(['DELETE /api/v2/events/event-1']);
});

test('discovery follows empty pages deliberately and exposes continuation for bounded reads', async () => {
  const paths: string[] = [];
  await endpoint((req, res) => {
    paths.push(req.url ?? '');
    res.end(
      JSON.stringify(
        req.url?.includes('cursor=next')
          ? {
              items: [{ id: 'event-2', title: 'Friends dinner' }],
              nextCursor: null,
            }
          : { items: [], nextCursor: 'next' }
      )
    );
  });
  const page = await cli(['events', 'discover']);
  expect(page.code).toBe(0);
  expect(JSON.parse(page.stdout)).toEqual({ items: [], nextCursor: 'next' });
  expect(paths).toHaveLength(1);
  const all = await cli(['events', 'discover', '--all']);
  expect(all.code).toBe(0);
  expect(JSON.parse(all.stdout)).toMatchObject({
    items: [{ id: 'event-2', title: 'Friends dinner' }],
    nextCursor: null,
  });
  expect(paths).toHaveLength(3);
  const human = await cli(['events', 'discover', '--all'], false);
  expect(human.stdout).toContain('event-2  Friends dinner');
  expect(human.stderr).toBe('');
});
test('join, settings and membership role expose stable result fields', async () => {
  let settings = {
    eventId: 'event-1',
    visibility: 'PRIVATE',
    permissions: {
      createPosts: 'EVERYONE',
      inviteMembers: 'MODERATOR',
      viewAttendeeList: 'EVERYONE',
    },
  };
  const writes: unknown[] = [];
  await endpoint(async (req, res) => {
    let data = '';
    for await (const chunk of req) data += chunk;
    if (req.method !== 'GET')
      writes.push({
        method: req.method,
        path: req.url,
        body: data ? JSON.parse(data) : null,
      });
    if (req.url?.endsWith('/join'))
      res.end(
        JSON.stringify({
          membershipId: 'member-1',
          success: true,
          role: 'ATTENDEE',
          rsvpStatus: 'PENDING',
          secret: 'private-test-key',
        })
      );
    else if (req.url?.endsWith('/members/member-1'))
      res.end(
        JSON.stringify({
          id: 'member-1',
          role: 'MODERATOR',
          secret: 'private-test-key',
        })
      );
    else {
      if (req.method === 'PATCH')
        settings = {
          ...settings,
          ...JSON.parse(data),
          permissions: {
            ...settings.permissions,
            ...JSON.parse(data).permissions,
          },
        };
      res.end(JSON.stringify(settings));
    }
  });
  const joined = await cli(['events', 'join', 'event-1']);
  expect(joined.code).toBe(0);
  expect(JSON.parse(joined.stdout)).toEqual({
    eventId: 'event-1',
    membershipId: 'member-1',
    joined: true,
    role: 'ATTENDEE',
    rsvpStatus: 'PENDING',
  });
  const joinedText = await cli(['events', 'join', 'event-1'], false);
  expect(joinedText.code).toBe(0);
  expect(joinedText.stdout).toContain('PENDING');
  const changed = await cli([
    'events',
    'settings',
    'set',
    'event-1',
    '--visibility',
    'FRIENDS',
    '--invite-members',
    'ORGANIZER',
  ]);
  expect(changed.code).toBe(0);
  expect(JSON.parse(changed.stdout)).toMatchObject({
    visibility: 'FRIENDS',
    permissions: { inviteMembers: 'ORGANIZER' },
  });
  const role = await cli([
    'events',
    'membership',
    'role',
    'event-1',
    'member-1',
    '--role',
    'MODERATOR',
    '--yes',
  ]);
  expect(role.code).toBe(0);
  expect(JSON.parse(role.stdout)).toEqual({
    eventId: 'event-1',
    membershipId: 'member-1',
    role: 'MODERATOR',
  });
  expect(writes).toEqual([
    { method: 'POST', path: '/api/v2/events/event-1/join', body: {} },
    { method: 'POST', path: '/api/v2/events/event-1/join', body: {} },
    {
      method: 'PATCH',
      path: '/api/v2/events/event-1/settings',
      body: {
        visibility: 'FRIENDS',
        permissions: { inviteMembers: 'ORGANIZER' },
      },
    },
    {
      method: 'PATCH',
      path: '/api/v2/events/event-1/members/member-1',
      body: { role: 'MODERATOR' },
    },
  ]);
});
test('unsafe mutations are not retried after a lost response and give inspection recovery', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.destroy();
  });
  const result = await cli(['events', 'join', 'event-1']);
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error).toMatchObject({
    code: 'UNCERTAIN_OUTCOME',
    message: expect.stringContaining('events get event-1'),
  });
  expect(writes).toBe(1);
});
test('unsupported servers, invalid roles and missing settings reject writes', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.end('{}');
  }, false);
  const unsupported = await cli(['events', 'delete', 'event-1', '--yes']);
  expect(unsupported.code).toBe(5);
  expect(JSON.parse(unsupported.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  const role = await cli([
    'events',
    'membership',
    'role',
    'event-1',
    'member-1',
    '--role',
    'ADMIN',
    '--yes',
  ]);
  expect(role.code).toBe(2);
  const empty = await cli(['events', 'settings', 'set', 'event-1']);
  expect(empty.code).toBe(2);
  expect(writes).toBe(0);
});
test('membership removal and leave require explicit confirmation and preserve target IDs', async () => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(`${req.method} ${req.url}`);
    if (req.method === 'DELETE') {
      res.statusCode = 204;
      res.end();
    } else res.end(JSON.stringify({ message: 'Left event successfully' }));
  });
  for (const command of [
    ['events', 'membership', 'remove', 'event-1', 'member-1'],
    ['events', 'leave', 'event-1'],
  ]) {
    const missing = await cli(command);
    expect(missing.code).toBe(2);
    expect(JSON.parse(missing.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  }
  expect(writes).toEqual([]);
  const removed = await cli([
    'events',
    'membership',
    'remove',
    'event-1',
    'member-1',
    '--yes',
  ]);
  expect(removed.code).toBe(0);
  expect(JSON.parse(removed.stdout)).toEqual({
    eventId: 'event-1',
    membershipId: 'member-1',
    removed: true,
  });
  const left = await cli(['events', 'leave', 'event-1', '--yes']);
  expect(left.code).toBe(0);
  expect(JSON.parse(left.stdout)).toEqual({ eventId: 'event-1', left: true });
});

test('refuses an old automatic-Yes server before sending the join', async () => {
  let joins = 0;
  await endpoint(
    (req, res) => {
      if (req.url?.endsWith('/join')) joins++;
      res.end(JSON.stringify({ membershipId: 'member-1', success: true }));
    },
    true,
    false
  );
  const result = await cli(['events', 'join', 'event-1']);
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(joins).toBe(0);
});

test('reads safe logistics and configures admission independently of visibility', async () => {
  const writes: unknown[] = [];
  await endpoint(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    if (req.method === 'PATCH') writes.push(JSON.parse(text));
    if (req.url?.endsWith('/logistics'))
      res.end(
        JSON.stringify({
          event: {
            _id: 'event-1',
            _creationTime: 1,
            title: 'Friends picnic',
            description: 'Lunch',
            location: 'Park',
            creatorId: 'person-1',
            timezone: 'UTC',
            visibility: 'FRIENDS',
            admissionPolicy: 'INVITATION_ONLY',
            chosenDateTime: null,
            chosenEndDateTime: null,
            imageUrl: null,
            createdAt: 1,
            updatedAt: 1,
            potentialDateTimeOptions: [
              { id: 'date-1', start: 1900000000000, end: null, note: null },
            ],
            memberships: [{ personId: 'private' }],
          },
          organizer: {
            personId: 'person-1',
            name: 'Avery',
            username: 'avery',
            image: null,
            email: 'private@example.com',
          },
          entryAction: 'INVITATION_ONLY',
          submissions: ['private'],
        })
      );
    else
      res.end(
        JSON.stringify({
          eventId: 'event-1',
          visibility: 'FRIENDS',
          admissionPolicy: 'DIRECT',
          permissions: {
            createPosts: 'EVERYONE',
            inviteMembers: 'MODERATOR',
            viewAttendeeList: 'EVERYONE',
          },
        })
      );
  });
  const preview = await cli(['events', 'preview', 'event-1']);
  expect(preview.code).toBe(0);
  const result = JSON.parse(preview.stdout);
  expect(result).toMatchObject({
    event: {
      _id: 'event-1',
      title: 'Friends picnic',
      admissionPolicy: 'INVITATION_ONLY',
    },
    entryAction: 'INVITATION_ONLY',
  });
  expect(result.event).not.toHaveProperty('memberships');
  expect(result).not.toHaveProperty('submissions');
  expect(result.organizer).not.toHaveProperty('email');
  const configured = await cli([
    'events',
    'settings',
    'set',
    'event-1',
    '--admission-policy',
    'DIRECT',
  ]);
  expect(configured.code).toBe(0);
  expect(JSON.parse(configured.stdout)).toMatchObject({
    visibility: 'FRIENDS',
    admissionPolicy: 'DIRECT',
  });
  expect(writes).toEqual([{ admissionPolicy: 'DIRECT' }]);
});

test('admission settings refuse an older server before attempting a write', async () => {
  let writes = 0;
  await endpoint(
    (req, res) => {
      if (req.method === 'PATCH') writes++;
      res.end(JSON.stringify({ eventId: 'event1', admissionPolicy: 'DIRECT' }));
    },
    true,
    true,
    false
  );
  const result = await cli([
    'events',
    'settings',
    'set',
    'event1',
    '--admission-policy',
    'DIRECT',
  ]);
  expect(result.code).not.toBe(0);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});
