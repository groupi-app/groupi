import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { CommunityExpulsionProgress } from './community-expulsion-progress';
vi.mock('@/lib/convex', () => ({
  api: { groups: { expulsions: { listProgress: 'listProgress' } } },
}));
vi.mock('convex/react', () => ({ useQuery: vi.fn() }));
vi.mock('./community-expulsion-action', () => ({
  CommunityExpulsionAction: ({ name }: { name: string }) => (
    <button>Resolve {name}</button>
  ),
}));
it('keeps reconciliation available for a former member outside the roster', () => {
  vi.mocked(useQuery).mockReturnValue({
    page: [{ personId: 'former-person', name: 'Former Member' }],
    continueCursor: '',
    isDone: true,
  });
  render(<CommunityExpulsionProgress groupId={'group' as Id<'groups'>} />);
  expect(
    screen.getByRole('region', { name: 'Community exclusion reconciliation' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Resolve Former Member' })
  ).toBeInTheDocument();
});
