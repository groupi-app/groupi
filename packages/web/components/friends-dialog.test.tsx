import 'tsconfig-paths/register';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { anyApi, getFunctionName } from 'convex/server';
import { FriendsDialog } from './friends-dialog';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';

const boundary = vi.hoisted(() => ({ incoming: true }));

vi.mock('@/convex/_generated/api', () => ({ api: anyApi }));
vi.mock('convex/react', () => ({
  useQuery: (query: Parameters<typeof getFunctionName>[0]) => {
    const name = query && getFunctionName(query);
    if (name === 'friends/queries:getPendingRequests')
      return boundary.incoming ? [request('received')] : [];
    if (name === 'friends/queries:getSentRequests')
      return [request('sent1'), request('sent2')];
    return [];
  },
  useMutation: () => {
    const mutation = vi.fn();
    return Object.assign(mutation, { withOptimisticUpdate: () => mutation });
  },
  useConvexAuth: () => ({ isAuthenticated: true }),
}));
const request = (id: string) => ({
  friendshipId: id,
  personId: id,
  userId: id,
  name: id,
  createdAt: Date.now(),
  mutualEventCount: 0,
});
afterEach(() => {
  cleanup();
  boundary.incoming = true;
  useFriendsDialogStore.getState().closeDialog();
});

it('counts only received requests needing attention while retaining sent requests', async () => {
  useFriendsDialogStore.getState().openDialog();
  const user = userEvent.setup();
  render(<FriendsDialog />);
  const tab = screen.getByRole('tab', { name: 'Requests 1 unread' });
  expect(screen.getByLabelText('1 unread')).toHaveAttribute(
    'data-slot',
    'unread-indicator'
  );
  await user.click(tab);
  expect(screen.getByText('Received (1)')).toBeVisible();
  expect(screen.getByText('Sent (2)')).toBeVisible();
});

it('shows no attention count for sent requests alone', () => {
  boundary.incoming = false;
  useFriendsDialogStore.getState().openDialog();
  render(<FriendsDialog />);
  expect(screen.getByRole('tab', { name: 'Requests' })).toBeVisible();
});
