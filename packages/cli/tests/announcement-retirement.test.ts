import { afterEach, expect, test, vi } from 'vitest';
import { Command } from 'commander';
import { sendAnnouncement } from '../src/group-announcements.js';
import { registerGroupCommands } from '../src/group-commands.js';
import { getProfile, credential } from '../src/profiles.js';

vi.mock('../src/profiles.js', () => ({
  getProfile: vi.fn(),
  credential: vi.fn(),
}));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

test('retired command explains posts before profile or credential access', async () => {
  const program = new Command();
  registerGroupCommands(program, true);
  await expect(
    program.parseAsync(['node', 'groupi', 'groups', 'announce', 'group-one'])
  ).rejects.toMatchObject({
    code: 'CONFLICT',
    message:
      'Announcements are retired. Create a post instead. No write was sent.',
  });
  expect(getProfile).not.toHaveBeenCalled();
  expect(credential).not.toHaveBeenCalled();
});

test('legacy send export never contacts even an older server', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(
    sendAnnouncement(
      { name: 'old', apiUrl: 'https://old.example/api/v2' },
      'synthetic',
      'group-one',
      {
        title: 'Old invocation',
        message: 'Not sent',
        requestId: 'old-request',
      }
    )
  ).rejects.toThrow('Announcements are retired. Create a post instead.');
  expect(fetch).not.toHaveBeenCalled();
});
