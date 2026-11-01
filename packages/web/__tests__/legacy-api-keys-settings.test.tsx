import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeysSettings } from '@/app/(settings)/settings/components/api-keys-settings';
const calls = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    apiKey: { list: calls.list, create: calls.create, delete: calls.revoke },
  },
}));
vi.mock('sonner', () => ({
  toast: { error: calls.error, success: calls.success },
}));
const key = {
  id: 'legacy-one',
  name: 'Long calendar integration credential',
  start: 'grp_short',
  createdAt: '2025-01-01',
  expiresAt: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('innerWidth', 1200);
  Reflect.deleteProperty(window, 'ontouchstart');
  calls.list.mockResolvedValue({ data: { apiKeys: [key] } });
  calls.create.mockResolvedValue({ data: { key: 'fixture-secret-once' } });
  calls.revoke.mockResolvedValue({ data: {} });
});
afterEach(() => vi.unstubAllGlobals());
it('opens a concise key action and revokes only after confirmation, with keyboard focus return', async () => {
  const user = userEvent.setup();
  render(<ApiKeysSettings />);
  const trigger = await screen.findByRole('button', {
    name: `Actions for ${key.name}`,
  });
  expect(screen.getByText('grp_short…')).toBeInTheDocument();
  expect(screen.queryByText('fixture-secret-once')).not.toBeInTheDocument();
  trigger.focus();
  await user.keyboard('{Enter}');
  await user.click(await screen.findByRole('menuitem', { name: 'Revoke' }));
  expect(calls.revoke).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(trigger).toHaveFocus());
  await user.click(trigger);
  await user.click(await screen.findByRole('menuitem', { name: 'Revoke' }));
  await user.click(screen.getByRole('button', { name: 'Confirm revocation' }));
  await waitFor(() =>
    expect(calls.revoke).toHaveBeenCalledWith({ keyId: 'legacy-one' })
  );
});
it('reveals a created secret only in the current dialog, reports clipboard failure, and forgets it on close', async () => {
  const user = userEvent.setup();
  render(<ApiKeysSettings />);
  await user.click(
    await screen.findByRole('button', { name: 'Create New Key' })
  );
  await user.type(screen.getByLabelText('Key Name'), 'Local test');
  await user.click(screen.getByRole('button', { name: 'Create Key' }));
  expect(await screen.findByText('fixture-secret-once')).toBeInTheDocument();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
    Error('Blocked')
  );
  await user.click(screen.getByRole('button', { name: 'Copy key' }));
  expect(calls.error).toHaveBeenCalledWith(
    'Could not copy. Select and copy the key manually.'
  );
  expect(calls.success).not.toHaveBeenCalledWith('Copied to clipboard');
  await user.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.queryByText('fixture-secret-once')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create New Key' }));
  expect(screen.getByLabelText('Key Name')).toHaveValue('');
  expect(screen.queryByText('fixture-secret-once')).not.toBeInTheDocument();
});
it('keeps an in-flight creation dialog open until the one-time secret arrives', async () => {
  let resolve!: (value: { data: { key: string } }) => void;
  calls.create.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  const user = userEvent.setup();
  render(<ApiKeysSettings />);
  await user.click(
    await screen.findByRole('button', { name: 'Create New Key' })
  );
  await user.type(screen.getByLabelText('Key Name'), 'Pending key');
  await user.click(screen.getByRole('button', { name: 'Create Key' }));
  await user.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await act(async () => resolve({ data: { key: 'pending-fixture-secret' } }));
  expect(await screen.findByText('pending-fixture-secret')).toBeInTheDocument();
});
