import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { Navigation } from './navigation';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';

vi.mock('@/components/auth/auth-wrappers', () => ({
  Authenticated: ({ children }: { children: ReactNode }) => children,
  Unauthenticated: () => null,
  AuthLoading: () => null,
  AdminOnly: () => null,
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({
    user: { name: 'Alex', email: 'alex@example.com', role: 'user' },
    userAndPerson: {},
    isLoading: false,
  }),
}));
vi.mock('@/hooks/convex/use-friends', () => ({ usePendingRequests: () => [] }));
vi.mock('@/lib/auth-client', () => ({ signOut: vi.fn() }));
vi.mock('./notifications-desktop', () => ({
  NotificationsDesktop: () => null,
}));
vi.mock('./profile-slate', () => ({ ProfileSlate: () => null }));
vi.mock('./combined-badge-count', () => ({ CombinedBadgeCount: () => null }));
vi.mock('./profile-edit-dialog', () => ({ ProfileEditDialog: () => null }));
vi.mock('@/components/molecules', () => ({
  AccountSwitcher: () => null,
  StatusPicker: () => null,
  MobileStatusPicker: () => null,
}));
// Keep the real modal behavior while isolating unrelated friends data queries.
vi.mock('./friends-dialog', async () => {
  const { Dialog, DialogContent, DialogTitle, DialogDescription } =
    await import('./ui/dialog');
  const { useFriendsDialogStore } = await import(
    '@/stores/friends-dialog-store'
  );
  return {
    FriendsDialog: () => {
      const { open, setOpen } = useFriendsDialogStore();
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Friends &amp; Groups</DialogTitle>
            <DialogDescription>Manage your community.</DialogDescription>
          </DialogContent>
        </Dialog>
      );
    },
  };
});

beforeEach(() => useFriendsDialogStore.getState().setOpen(false));

it('opens one accessible friends dialog when both navigation variants are mounted', () => {
  render(<Navigation items={[]} />);
  act(() => useFriendsDialogStore.getState().openDialog('groups'));
  expect(
    screen.getAllByRole('dialog', { name: 'Friends & Groups' })
  ).toHaveLength(1);
  expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);
});
