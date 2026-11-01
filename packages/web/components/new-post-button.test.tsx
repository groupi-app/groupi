import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NewPostButton } from './new-post-button';

vi.mock('@/hooks/use-mobile', () => ({ useMobile: () => false }));
const permissions = {
  createPosts: 'EVERYONE',
  inviteMembers: 'MODERATOR',
  viewAttendeeList: 'ORGANIZER',
} as const;

describe('Event content creation', () => {
  it('opens a desktop action menu containing all four creation destinations', async () => {
    const user = userEvent.setup();
    render(<NewPostButton permissions={permissions} userRole='ATTENDEE' />);
    await user.click(screen.getByRole('button', { name: 'New content' }));
    const menu = screen.getByRole('menu', { name: 'New content' });
    for (const [name, path] of [
      ['Post', 'new-post'],
      ['Form', 'forms/new'],
      ['List', 'lists/new'],
      ['Poll', 'polls/new'],
    ]) {
      const destination = within(menu).getByRole('menuitem', { name });
      expect(destination).toHaveAttribute('href', `/test/${path}`);
      expect(within(destination).queryByRole('button')).not.toBeInTheDocument();
    }
  });

  it('does not offer creation when the attendee lacks permission', () => {
    render(
      <NewPostButton
        permissions={{ ...permissions, createPosts: 'MODERATOR' }}
        userRole='ATTENDEE'
      />
    );
    expect(
      screen.queryByRole('button', { name: 'New content' })
    ).not.toBeInTheDocument();
  });
});
