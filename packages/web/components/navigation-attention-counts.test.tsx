import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MobileNav } from './mobile-nav';
import { ProfileDropdown } from './profile-dropdown';
import { useNotificationCloseStore } from '@/stores/notification-close-store';

vi.mock('@/hooks/convex/use-friends', () => ({
  usePendingRequests: () => [{}, {}],
}));
vi.mock('@/lib/auth-client', () => ({ signOut: vi.fn() }));
vi.mock('./profile-slate', () => ({ ProfileSlate: () => null }));
vi.mock('./combined-badge-count', () => ({ CombinedBadgeCount: () => null }));
vi.mock('./profile-edit-dialog', () => ({ ProfileEditDialog: () => null }));
vi.mock('@/components/molecules', () => ({
  AccountSwitcher: () => null,
  StatusPicker: () => null,
  MobileStatusPicker: () => null,
}));

afterEach(() => {
  cleanup();
  useNotificationCloseStore.getState().setSheetOpen(false);
});

it('shows a solid attention counter in the mobile Friends & Groups action', async () => {
  render(
    <MobileNav
      items={[]}
      userInfo={{ name: 'Alex', email: 'alex@example.com' }}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  const action = screen.getByRole('button', { name: /Friends & Groups/ });
  expect(within(action).getByLabelText('2 unread')).toHaveAttribute(
    'data-slot',
    'unread-indicator'
  );
});

it('uses attention counters on the profile trigger and its Friends & Groups action', async () => {
  render(
    <ProfileDropdown userInfo={{ name: 'Alex', email: 'alex@example.com' }} />
  );
  const trigger = screen.getByLabelText('2 unread').closest('button');
  expect(trigger).not.toBeNull();
  await userEvent.click(trigger!);
  const action = screen.getByRole('menuitem', { name: /Friends & Groups/ });
  expect(within(action).getByLabelText('2 unread')).toHaveAttribute(
    'data-slot',
    'unread-indicator'
  );
  expect(screen.getAllByLabelText('2 unread')).toHaveLength(2);
});
