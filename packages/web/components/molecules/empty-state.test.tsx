import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('gives an empty section a heading and usable next action in the soft presentation', async () => {
    const create = vi.fn();
    render(
      <EmptyState
        presentation='soft'
        message='No groups yet'
        description='Create a group to plan together.'
        icon={<span>✦</span>}
        action={<button onClick={create}>Create group</button>}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'No groups yet' })
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Create group' }));
    expect(create).toHaveBeenCalledOnce();
  });
});
