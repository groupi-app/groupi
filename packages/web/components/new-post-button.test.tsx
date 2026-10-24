import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NewPostButton } from './new-post-button';

const permissions = {
  createPosts: 'EVERYONE',
  inviteMembers: 'MODERATOR',
  viewAttendeeList: 'ORGANIZER',
} as const;

describe('New Post destination', () => {
  it('exposes one link without a nested button for keyboard and screen reader navigation', () => {
    render(<NewPostButton permissions={permissions} userRole='ATTENDEE' />);
    const destination = screen.getByRole('link', { name: 'New Post' });
    expect(destination).toHaveAttribute('href', '/test/new-post');
    expect(within(destination).queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not offer the destination when the attendee cannot create posts', () => {
    render(
      <NewPostButton
        permissions={{ ...permissions, createPosts: 'MODERATOR' }}
        userRole='ATTENDEE'
      />
    );
    expect(
      screen.queryByRole('link', { name: 'New Post' })
    ).not.toBeInTheDocument();
  });
});
