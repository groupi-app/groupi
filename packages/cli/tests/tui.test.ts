import React, { act } from 'react';
import { render, cleanup } from 'ink-testing-library';
import { afterEach, expect, test, vi } from 'vitest';
import { TerminalApp } from '../src/tui/app.js';
import { TerminalSession, safeText } from '../src/tui/session.js';
import { CliError } from '../src/errors.js';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { planningScreens } from '../src/tui/screens.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const pause = () => new Promise(done => setTimeout(done, 60));
const profile = {
  name: 'staging-organizer',
  apiUrl: 'https://example.invalid/api/v2',
};

test('active screen refreshes after five seconds, retains stale data, backs off, then reconnects', async () => {
  vi.useFakeTimers();
  let connected = true;
  let count = 0;
  const session = new TerminalSession({
    id: 'events',
    load: async () => {
      count++;
      if (!connected)
        throw new Error('secret credentials must not be rendered');
      return { title: `Events ${count}`, entries: [] };
    },
  });
  await session.refresh();
  expect(session.state.view?.title).toBe('Events 1');
  connected = false;
  await vi.advanceTimersByTimeAsync(5000);
  expect(session.state.view?.title).toBe('Events 1');
  expect(session.state.error).toContain('Connection failed');
  expect(session.state.error).not.toContain('secret');
  await vi.advanceTimersByTimeAsync(9999);
  expect(count).toBe(2);
  await vi.advanceTimersByTimeAsync(1);
  expect(count).toBe(3);
  connected = true;
  await session.refresh();
  expect(session.state.error).toBeNull();
  expect(session.state.failures).toBe(0);
  expect(session.state.view?.title).toBe('Events 4');
  session.dispose();
  await vi.advanceTimersByTimeAsync(60000);
  expect(count).toBe(4);
});

test('navigation discards a slow previous response and cleanup ignores pending requests', async () => {
  let finish!: (view: { title: string; entries: [] }) => void;
  const session = new TerminalSession({
    id: 'slow',
    load: () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  });
  const pending = session.refresh();
  session.open({
    id: 'new',
    load: async () => ({ title: 'New screen', entries: [] }),
  });
  await Promise.resolve();
  finish({ title: 'Wrong screen', entries: [] });
  await pending;
  expect(session.state.view?.title).toBe('New screen');
  session.dispose();
});

test('confirmed writes serialize, refresh immediately, and do not replay uncertain writes', async () => {
  let release!: () => void;
  let writes = 0;
  let reads = 0;
  const session = new TerminalSession({
    id: 'event',
    load: async () => {
      reads++;
      return { title: 'Event', entries: [] };
    },
  });
  await session.refresh();
  const action = {
    id: 'write',
    label: 'RSVP event-1',
    run: async () => {
      writes++;
      await new Promise<void>(resolve => {
        release = resolve;
      });
      throw new CliError(
        'UNCERTAIN_OUTCOME',
        'Inspect your RSVP before another update.',
        5
      );
    },
  };
  const first = session.execute(action, {});
  await session.execute(action, {});
  expect(writes).toBe(1);
  release();
  await first;
  expect(reads).toBe(2);
  expect(session.state.notice).toContain('UNCERTAIN_OUTCOME');
  expect(session.state.busy).toBe(false);
  session.dispose();
});

test('keyboard form defaults to cancellation, shows target/profile, and saves only after explicit confirmation', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // Ink uses the Windows ASCII pointer and Unicode elsewhere.
  const pointer = process.platform === 'win32' ? '>' : '❯';
  const saved: Record<string, string>[] = [];
  let reads = 0;
  const session = new TerminalSession({
    id: 'event',
    load: async () => {
      reads++;
      return {
        title: 'Picnic',
        entries: [],
        actions: [
          {
            id: 'edit',
            label: 'Edit event picnic-1',
            command: 'events edit',
            fields: [{ name: 'title', label: 'New title' }],
            run: async values => {
              saved.push(values);
            },
          },
        ],
      };
    },
  });
  let ui!: ReturnType<typeof render>;
  await act(async () => {
    ui = render(React.createElement(TerminalApp, { session, profile }));
  });
  // Rendering the prompt precedes Ink's passive input-subscription effect.
  // act flushes that effect and pending input state before the next keystroke.
  const press = async (input: string) => {
    await act(async () => {
      ui.stdin.write(input);
    });
  };
  const waitForFrame = (text: string) =>
    vi.waitFor(() => expect(ui.lastFrame()).toContain(text));
  await waitForFrame(`${pointer} Edit event picnic-1`);
  expect(ui.lastFrame()).toContain('staging-organizer');
  await press('\r');
  await waitForFrame('New title');
  await press('Updated picnic');
  await waitForFrame('Updated picnic');
  await press('\r');
  await waitForFrame('Confirm Edit event picnic-1');
  expect(ui.lastFrame()).toContain('title: Updated picnic');
  expect(ui.lastFrame()).toContain(`${pointer} Cancel`);
  await press('\r');
  await waitForFrame(`${pointer} Edit event picnic-1`);
  expect(ui.lastFrame()).not.toContain('Confirm Edit');
  expect(saved).toEqual([]);
  await press('\r');
  await waitForFrame('New title');
  await press('Final title');
  await waitForFrame('Final title');
  await press('\r');
  await waitForFrame('title: Final title');
  expect(ui.lastFrame()).toContain(`${pointer} Cancel`);
  await press('\u001b[B');
  await waitForFrame(`${pointer} Confirm`);
  await press('\r');
  await vi.waitFor(() => expect(saved).toEqual([{ title: 'Final title' }]));
  await waitForFrame('Completed: Edit event picnic-1');
  await vi.waitFor(() => expect(session.state.loading).toBe(false));
  expect(reads).toBe(2);
  await press('q');
  await vi.waitFor(() => expect(session.disposed).toBe(true));
});

test('piped and JSON public invocations never open the terminal interface', () => {
  for (const args of [
    ['tui'],
    ['tui', '--format', 'json'],
    ['--format', 'json'],
    ['--non-interactive'],
  ]) {
    const result = spawnSync(
      process.execPath,
      [resolve('bin/groupi.js'), ...args],
      {
        encoding: 'utf8',
        timeout: 5000,
        env: { ...process.env, GROUPI_API_KEY: '' },
      }
    );
    expect(result.error).toBeUndefined();
    if (args.includes('tui')) expect(result.status).toBe(2);
    expect(result.stdout + result.stderr).not.toContain('Plan together');
    if (args.includes('json'))
      expect(JSON.parse(result.stderr).error.code).toMatch(
        /USAGE|INTERACTIVE_REQUIRED/
      );
  }
});

test('remote control sequences cannot move the cursor or spoof direction', () => {
  expect(safeText('hello\x1b[2J\r\u202e')).toBe('hello [2J  ');
});

test('notification detail refreshes through shared services, retains the selected profile, and reflects read changes', async () => {
  let read = false;
  const requests: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    expect(url.startsWith(profile.apiUrl)).toBe(true);
    expect(new Headers(init.headers).get('x-api-key')).toBe('fixture-key');
    const path = url.slice(profile.apiUrl.length);
    requests.push(path);
    if (path === '/health')
      return Response.json({
        capabilities: { notificationControls: { version: 1 } },
      });
    if (path === '/notifications/n1/read') {
      read = true;
      return Response.json({ message: 'Read' });
    }
    return Response.json({
      items: [
        {
          id: 'n1',
          type: 'POST',
          read,
          createdAt: 1,
          event: { id: 'event1', title: 'Picnic' },
          post: null,
          author: null,
        },
      ],
      nextCursor: null,
    });
  });
  const screens = planningScreens(profile, 'fixture-key');
  const list = await screens.notifications().load();
  const detail = list.entries[0].screen;
  const before = await detail.load();
  expect(before.lines).toContain('read: false');
  await before.actions!.find(action => action.id === 'read')!.run({});
  const after = await detail.load();
  expect(after.lines).toContain('read: true');
  expect(
    requests.filter(path => path === '/notifications/n1/read')
  ).toHaveLength(1);
  expect(JSON.stringify(after.lines)).not.toContain('fixture-key');
});

test('discussion reads rich content without modifying it, title-only edits preserve the body, and creates escape plain text', async () => {
  const original = '<p>Hello <strong>friends</strong></p>';
  const bodies: unknown[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = url.slice(profile.apiUrl.length);
    if (path === '/health')
      return Response.json({ capabilities: { discussion: { version: 1 } } });
    if (init.method === 'PATCH') {
      bodies.push(JSON.parse(String(init.body)));
      return Response.json({ id: 'post1' });
    }
    if (init.method === 'POST') {
      bodies.push(JSON.parse(String(init.body)));
      return Response.json({ postId: 'post2' });
    }
    if (path.startsWith('/events/'))
      return Response.json({
        items: [{ id: 'post1', title: 'Thread', content: original }],
        nextCursor: null,
      });
    return Response.json({ id: 'post1', title: 'Thread', content: original });
  });
  const screens = planningScreens(profile, 'fixture-key');
  const detail = await screens.discussionDetail('posts', 'post1').load();
  expect(detail.lines).toContain('Hello friends');
  expect(detail.actions!.some(action => action.id === 'plain')).toBe(false);
  await detail
    .actions!.find(action => action.id === 'title')!
    .run({ title: 'Renamed' });
  expect(bodies[0]).toEqual({ title: 'Renamed' });
  const list = await screens.discussion('posts', 'event1').load();
  await list.actions![0].run({
    title: 'New post',
    body: '<script>literal text</script>',
  });
  expect(bodies[1]).toEqual({
    title: 'New post',
    content: '<p>&lt;script&gt;literal text&lt;/script&gt;</p>',
  });
});

test('friend removal targets the friendship while blocking targets the person', async () => {
  const deleted: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = url.slice(profile.apiUrl.length);
    if (path === '/health')
      return Response.json({ capabilities: { socialWrites: { version: 1 } } });
    if (init.method === 'DELETE') {
      deleted.push(path);
      return new Response(null, { status: 204 });
    }
    if (init.method === 'POST') {
      deleted.push(path);
      return Response.json({ message: 'Blocked' });
    }
    return Response.json({
      items: [
        {
          personId: 'person1',
          userId: 'user1',
          friendshipId: 'friendship1',
          name: 'Friend',
          username: 'friend',
          image: null,
          lastSeen: null,
        },
      ],
      nextCursor: null,
    });
  });
  const list = await planningScreens(profile, 'fixture-key')
    .social('friends')
    .load();
  const detail = await list.entries[0].screen.load();
  await detail.actions!.find(action => action.id === 'remove')!.run({});
  await detail.actions!.find(action => action.id === 'block')!.run({});
  expect(deleted).toEqual(['/friends/friendship1', '/blocks/person1']);
});

test('attachment forms use shared atomic orchestration and preserve cleanup after rejected parent writes', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'groupi-tui-'));
  const file = resolve(directory, 'note.txt');
  await writeFile(file, 'hello');
  let rejectUpload = true;
  let parents = 0;
  const cleaned: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = url.slice(profile.apiUrl.length);
    if (path === '/health')
      return Response.json({ capabilities: { discussion: { version: 1 } } });
    if (path.startsWith('/uploads?'))
      return rejectUpload
        ? Response.json({}, { status: 403 })
        : Response.json({
            storageId: 'storage1',
            mimeType: 'text/plain',
            size: 5,
          });
    if (path === '/uploads/storage1' && init.method === 'DELETE') {
      cleaned.push(path);
      return new Response(null, { status: 204 });
    }
    if (init.method === 'POST') {
      parents++;
      expect(JSON.parse(String(init.body)).attachments[0].filename).toBe(
        'note.txt'
      );
      return Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
    }
    return Response.json({ items: [], nextCursor: null });
  });
  try {
    const screen = await planningScreens(profile, 'fixture-key')
      .discussion('posts', 'event1')
      .load();
    const create = screen.actions!.find(action => action.id === 'create')!;
    await expect(
      create.run({ title: 'Files', body: 'hello', attachment: file })
    ).rejects.toThrow('cannot upload files');
    expect(parents).toBe(0);
    rejectUpload = false;
    await expect(
      create.run({ title: 'Files', body: 'hello', attachment: file })
    ).rejects.toThrow();
    expect(parents).toBe(1);
    expect(cleaned).toEqual(['/uploads/storage1']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('offline refresh cancels an open confirmation and reconnect restores actions', async () => {
  let connected = true;
  const write = vi.fn(async () => undefined);
  const session = new TerminalSession({
    id: 'offline',
    load: async () => {
      if (!connected) throw new Error('private network details');
      return {
        title: 'Cached picnic',
        entries: [],
        actions: [
          {
            id: 'remove',
            label: 'Remove friend person1',
            command: 'friends remove',
            run: write,
          },
        ],
      };
    },
  });
  const ui = render(React.createElement(TerminalApp, { session, profile }));
  await pause();
  ui.stdin.write('\r');
  await pause();
  expect(ui.lastFrame()).toContain('Confirm Remove friend person1');
  connected = false;
  await session.refresh();
  await pause();
  expect(ui.lastFrame()).toContain('Disconnected / stale');
  expect(ui.lastFrame()).toContain('Cached picnic');
  expect(ui.lastFrame()).not.toContain('Confirm Remove');
  expect(ui.lastFrame()).not.toContain('private network');
  ui.stdin.write('\u001b[B');
  ui.stdin.write('\r');
  await pause();
  await session.execute({ id: 'stale', label: 'Stale write', run: write }, {});
  expect(write).not.toHaveBeenCalled();
  connected = true;
  ui.stdin.write('r');
  await pause();
  expect(ui.lastFrame()).toContain('Connected');
  expect(ui.lastFrame()).toContain('Remove friend person1');
  ui.stdin.write('q');
  await pause();
});

test('keyboard navigation preserves profile through planning, discussion, social, and advanced fallback', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    expect(url.startsWith(profile.apiUrl)).toBe(true);
    const path = url.slice(profile.apiUrl.length);
    if (path === '/health')
      return Response.json({ capabilities: { discussion: { version: 1 } } });
    if (path === '/events/event1')
      return Response.json({ id: 'event1', title: 'Picnic' });
    if (path.startsWith('/events/event1/posts'))
      return Response.json({
        items: [{ id: 'post1', title: 'Thread', content: '<p>Welcome</p>' }],
        nextCursor: null,
      });
    return Response.json({ items: [], nextCursor: null });
  });
  const screens = planningScreens(profile, 'fixture-key');
  const session = new TerminalSession(screens.home);
  const ui = render(React.createElement(TerminalApp, { session, profile }));
  await pause();
  ui.stdin.write('\r');
  await pause();
  expect(ui.lastFrame()).toContain('Your events');
  expect(ui.lastFrame()).toContain('Create event');
  session.open(screens.event('event1'));
  await pause();
  for (let i = 0; i < 4; i++) {
    ui.stdin.write('\u001b[B');
    await pause();
  }
  ui.stdin.write('\r');
  await pause();
  expect(ui.lastFrame()).toContain('Event discussion');
  expect(ui.lastFrame()).toContain('Thread');
  expect(ui.lastFrame()).toContain(profile.name);
  ui.stdin.write('b');
  await pause();
  expect(ui.lastFrame()).toContain('Picnic');
  session.open(screens.social('incoming'));
  await pause();
  expect(ui.lastFrame()).toContain('Send friend request');
  expect(ui.lastFrame()).toContain(profile.apiUrl);
  session.open(screens.home);
  await pause();
  for (let i = 0; i < 8; i++) {
    ui.stdin.write('\u001b[B');
    await pause();
  }
  ui.stdin.write('\r');
  await pause();
  expect(ui.lastFrame()).toContain('Advanced commands');
  expect(ui.lastFrame()).toContain('groupi --profile staging-organizer');
  expect(ui.lastFrame()).not.toContain('fixture-key');
  ui.stdin.write('q');
  await pause();
});
