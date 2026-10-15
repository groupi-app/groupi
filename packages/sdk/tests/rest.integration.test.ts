import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { cliRestBridge } from '../../../convex/tests/cli-rest-bridge.helpers';
describe('SDK public methods through authenticated REST transactions', () => {
  let bridge: Awaited<ReturnType<typeof cliRestBridge>>;
  beforeEach(async () => {
    bridge = await cliRestBridge();
    process.env.CLI_TEST_BIN = fileURLToPath(
      new URL('./installed-driver.mjs', import.meta.url)
    );
  });
  afterEach(async () => {
    await bridge.close();
    delete process.env.CLI_TEST_BIN;
  });
  it.each(['installed-driver.mjs', 'python-driver.mjs'])(
    '%s creates, pages, and preserves owner versus unrelated-actor authority',
    async driver => {
      process.env.CLI_TEST_BIN = fileURLToPath(
        new URL('./' + driver, import.meta.url)
      );
      const owner = await bridge.actor('sdk-owner');
      const outsider = await bridge.actor('sdk-outsider');
      const created = await bridge.cli(owner.rawKey, [
        'createEvent',
        JSON.stringify({ body: { title: 'SDK dinner' } }),
      ]);
      expect(created.code, created.stdout + created.stderr).toBe(0);
      const event = JSON.parse(created.stdout);
      const read = await bridge.cli(owner.rawKey, [
        'getEvent',
        JSON.stringify({ path: { eventId: event.eventId } }),
      ]);
      expect(read.code, read.stderr).toBe(0);
      expect(JSON.parse(read.stdout).title).toBe('SDK dinner');
      const denied = await bridge.cli(outsider.rawKey, [
        'getEvent',
        JSON.stringify({ path: { eventId: event.eventId } }),
      ]);
      expect(denied.code).toBe(1);
      expect(JSON.parse(denied.stdout).status).toBe(403);
      const invite = await bridge.cli(owner.rawKey, [
        'createLinkInvitation',
        JSON.stringify({ path: { eventId: event.eventId }, body: {} }),
      ]);
      expect(invite.code, invite.stdout + invite.stderr).toBe(0);
      const accepted = await bridge.cli(outsider.rawKey, [
        'acceptBearerInvitation',
        JSON.stringify({ path: { token: JSON.parse(invite.stdout).token } }),
      ]);
      expect(accepted.code, accepted.stdout + accepted.stderr).toBe(0);
      const uploaded = await bridge.cli(outsider.rawKey, [
        'upload',
        JSON.stringify({
          content: 'Dinner attachment',
          metadata: { filename: 'notes.txt', mimeType: 'text/plain' },
        }),
      ]);
      expect(uploaded.code, uploaded.stdout + uploaded.stderr).toBe(0);
      const attachment = JSON.parse(uploaded.stdout);
      const post = await bridge.cli(outsider.rawKey, [
        'createPost',
        JSON.stringify({
          path: { id: event.eventId },
          body: {
            title: 'Dinner notes',
            content: 'Bring a dish',
            attachments: [attachment],
          },
        }),
      ]);
      expect(post.code, post.stdout + post.stderr).toBe(0);
      const posts = await bridge.cli(owner.rawKey, [
        'listPosts',
        JSON.stringify({
          path: { parentId: event.eventId },
          query: { pagination: 'cursor', limit: 10 },
        }),
      ]);
      expect(posts.code, posts.stdout + posts.stderr).toBe(0);
      expect(posts.stdout).toContain('Dinner notes');
      expect(posts.stdout).toContain('notes.txt');
      const notifications = await bridge.cli(owner.rawKey, [
        'listNotifications',
        JSON.stringify({ query: { pagination: 'cursor', limit: 10 } }),
      ]);
      expect(
        notifications.code,
        notifications.stdout + notifications.stderr
      ).toBe(0);
      const page = await bridge.cli(owner.rawKey, [
        'listEvents',
        JSON.stringify({ query: { pagination: 'cursor', limit: 1 } }),
      ]);
      expect(page.code, page.stderr).toBe(0);
      expect(JSON.parse(page.stdout).items).toHaveLength(1);
    }
  );
});
