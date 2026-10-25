import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewContentMenu } from './new-content-menu';

const state = vi.hoisted(() => ({ mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useMobile: () => state.mobile }));
const allowed = { post: true, form: true, list: true, poll: true };

beforeEach(() => {
  state.mobile = false;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});
describe('shared creation menu', () => {
  it('supports keyboard opening, ordered choices, disabled policies and Escape dismissal', async () => {
    const user = userEvent.setup();
    render(
      <NewContentMenu
        context='group'
        basePath='/groups/community'
        allowed={{ ...allowed, poll: false }}
      />
    );
    const trigger = screen.getByRole('button', { name: 'New content' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const items = screen.getAllByRole('menuitem');
    expect(items.map(item => item.textContent)).toEqual([
      'Post',
      'Form',
      'List',
      'Poll (unavailable)',
    ]);
    expect(items[0]).toHaveAttribute('href', '/groups/community/posts/new');
    expect(items[3]).toHaveAttribute('aria-disabled', 'true');
    expect(items[3]).not.toHaveAttribute('href');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('uses a mobile drawer with labeled choices and a working cancel action', async () => {
    state.mobile = true;
    const user = userEvent.setup();
    render(
      <NewContentMenu
        context='event'
        basePath='/event/party'
        allowed={allowed}
      />
    );
    await user.click(screen.getByRole('button', { name: 'New content' }));
    const drawer = screen.getByRole('dialog', { name: 'New content' });
    expect(within(drawer).getByRole('link', { name: 'Post' })).toHaveAttribute(
      'href',
      '/event/party/new-post'
    );
    expect(within(drawer).getByRole('link', { name: 'Form' })).toHaveAttribute(
      'href',
      '/event/party/forms/new'
    );
    expect(within(drawer).getByRole('link', { name: 'List' })).toHaveAttribute(
      'href',
      '/event/party/lists/new'
    );
    expect(within(drawer).getByRole('link', { name: 'Poll' })).toHaveAttribute(
      'href',
      '/event/party/polls/new'
    );
  });
});
