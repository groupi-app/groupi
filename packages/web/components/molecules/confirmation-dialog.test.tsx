import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmationDialog } from './confirmation-dialog';

it('keeps the confirmation open while saving, then closes after success', async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const save = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      })
  );
  render(
    <Dialog>
      <DialogTrigger>Delete item</DialogTrigger>
      <ConfirmationDialog
        title='Delete item?'
        description='This cannot be undone.'
        onConfirm={save}
      />
    </Dialog>
  );
  await user.click(screen.getByRole('button', { name: 'Delete item' }));
  await user.dblClick(screen.getByRole('button', { name: 'Confirm' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});

it('preserves failure context and lets the user retry once', async () => {
  const user = userEvent.setup();
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(undefined);
  render(
    <Dialog defaultOpen>
      <ConfirmationDialog
        title='Delete item?'
        description='This cannot be undone.'
        onConfirm={save}
      />
    </Dialog>
  );
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to complete this action. Please try again.'
  );
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'This cannot be undone.'
  );
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(save).toHaveBeenCalledTimes(2);
});
