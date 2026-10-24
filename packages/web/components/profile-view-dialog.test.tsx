import 'tsconfig-paths/register';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProfileViewDialog } from './profile-view-dialog';

const boundary = vi.hoisted(() => ({ loaded: false }));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: { user: { id: 'viewer' } } }),
}));
vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: { userId?: string }) =>
    args?.userId
      ? boundary.loaded
        ? { user: { name: 'Sam', email: 'sam@example.com' } }
        : undefined
      : [],
  useMutation: () => vi.fn(),
  useConvexAuth: () => ({ isAuthenticated: true }),
}));

afterEach(cleanup);

it('opens another person’s profile on an available mutual friends tab', () => {
  boundary.loaded = false;
  const { rerender } = render(
    <ProfileViewDialog userId='sam' open onOpenChange={() => {}} />
  );
  boundary.loaded = true;
  rerender(<ProfileViewDialog userId='sam' open onOpenChange={() => {}} />);
  expect(screen.getByRole('tab', { name: /Mutual Friends/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByText('No mutual friends found.')).toBeVisible();
});
