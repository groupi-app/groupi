import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';
import { CommunityExpulsionAction } from './community-expulsion-action';
import type { Id } from '@/convex/_generated/dataModel';
vi.mock('@/lib/convex', () => ({
  api: {
    groups: {
      expulsions: {
        expel: 'expel',
        progress: 'progress',
        resume: 'resume',
        reinstate: 'reinstate',
      },
    },
  },
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

it('retries an uncertain cleanup with the original operation and generation', async () => {
  const resume = vi
    .fn()
    .mockRejectedValueOnce(new Error('Lost response'))
    .mockResolvedValue({ outcome: 'committed' });
  vi.mocked(useMutation).mockImplementation(((name: string) =>
    name === 'resume' ? resume : vi.fn()) as never);
  vi.mocked(useQuery).mockReturnValue({
    outcome: 'committed',
    exclusion: 'active',
    cleanup: 'blocked',
    generation: 7,
    conflicts: [],
  });
  render(
    <CommunityExpulsionAction
      groupId={'group' as Id<'groups'>}
      personId={'person' as Id<'persons'>}
      name='Member'
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Resume cleanup for Member' })
  );
  await screen.findByRole('alert');
  fireEvent.click(
    screen.getByRole('button', { name: 'Resume cleanup for Member' })
  );
  await waitFor(() => expect(resume).toHaveBeenCalledTimes(2));
  expect(resume.mock.calls[1][0]).toEqual(resume.mock.calls[0][0]);
  expect(resume.mock.calls[0][0]).toMatchObject({
    generation: 7,
    groupId: 'group',
    personId: 'person',
  });
});
