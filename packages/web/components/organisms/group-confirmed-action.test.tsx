import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { GroupConfirmedAction } from './group-confirmed-action';

it('moves keyboard focus to confirmation and restores it when cancelled', async () => {
  const user = userEvent.setup();
  const confirm = vi.fn();
  render(
    <GroupConfirmedAction
      label='Leave Group'
      confirmation='Confirm leaving Neighbors'
      explanation='Leaving ends your Group membership.'
      onConfirm={confirm}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Leave Group' }));
  expect(
    screen.getByRole('button', { name: 'Confirm leaving Neighbors' })
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('button', { name: 'Leave Group' })).toHaveFocus();
  expect(confirm).not.toHaveBeenCalled();
});
