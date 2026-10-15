import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';
import { CommunityExpulsionAction } from './community-expulsion-action';
import type { Id } from '@/convex/_generated/dataModel';
vi.mock('@/lib/convex', () => ({
  api: { groups: { expulsions: { expel: 'expel', progress: 'progress' } } },
}));
vi.mock('convex/react', () => ({ useQuery: vi.fn(), useMutation: vi.fn() }));
beforeEach(() => {
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
});
it('shows committed exclusion separately from blocked Organizer cleanup', () => {
  vi.mocked(useQuery).mockReturnValue({
    outcome: 'committed',
    exclusion: 'active',
    cleanup: 'blocked',
    generation: 1,
    conflicts: [{ eventId: 'event', code: 'PROTECTED_ORGANIZER' }],
  });
  render(
    <CommunityExpulsionAction
      groupId={'group' as Id<'groups'>}
      personId={'person' as Id<'persons'>}
      name='Member'
    />
  );
  expect(
    screen.getByText('Exclusion committed. Cleanup blocked.')
  ).toBeInTheDocument();
  expect(
    screen.getByText('Resolve protected Organizer ownership before cleanup.')
  ).toBeInTheDocument();
  expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
});
