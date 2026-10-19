import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { AppReviewSettings } from './organisms/app-review-settings';
vi.mock('@/convex/_generated/api', () => ({
  api: {
    auth: { queries: { getCurrentUser: 'current-user' } },
    delegatedApps: {
      hosted: { configureAppearance: 'configure-appearance' },
      queries: { listReviewableApps: 'reviewable-apps' },
      mutations: { reviewApp: 'review-app' },
    },
  },
}));
const app = {
  _id: 'app-1',
  ownerPersonId: 'person-1',
  ownerDisplayName: 'Developer',
  name: 'Calendar',
  purpose: 'Read the selected event schedule',
  clientType: 'native',
  redirectUris: ['com.example.calendar:/callback'],
  status: 'testing',
  reviewStatus: 'pending',
  createdAt: 1,
  updatedAt: 1,
};
beforeEach(() => {
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
});
it('denies non-administrators without exposing reviewable app details', () => {
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { role: 'user' } : [app]
  );
  render(<AppReviewSettings />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Platform administrator access required'
  );
  expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Approve/ })
  ).not.toBeInTheDocument();
});
it('an administrator reviews the disclosed app and confirms approval before acknowledging success', async () => {
  const review = vi.fn().mockResolvedValue(null);
  vi.mocked(useMutation).mockReturnValue(review as never);
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { role: 'admin' } : [app]
  );
  const user = userEvent.setup();
  render(<AppReviewSettings />);
  expect(
    screen.getByText('Read the selected event schedule')
  ).toBeInTheDocument();
  expect(
    screen.getByText('com.example.calendar:/callback')
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Approve Calendar' }));
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Review is not a safety guarantee'
  );
  expect(review).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Confirm approval' }));
  expect(review).toHaveBeenCalledWith({ appId: 'app-1', status: 'approved' });
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Calendar approved for wider access'
  );
});
it.each([
  [
    'rejected',
    'Reject Calendar',
    'Confirm rejection',
    'Calendar review rejected',
  ],
  ['suspended', 'Suspend Calendar', 'Confirm suspension', 'Calendar suspended'],
] as const)(
  'an administrator confirms the %s state transition and sees the live queue update',
  async (status, action, confirmation, notice) => {
    let current = { ...app };
    const review = vi.fn().mockImplementation(async () => {
      current = {
        ...current,
        status: status === 'suspended' ? 'suspended' : 'testing',
        reviewStatus: status === 'rejected' ? 'rejected' : 'reviewed',
      };
    });
    vi.mocked(useMutation).mockReturnValue(review as never);
    vi.mocked(useQuery).mockImplementation((...args) => {
      if (args[0] === ('current-user' as never)) return { role: 'admin' };
      const filter =
        (args[1] as { reviewStatus?: string })?.reviewStatus ?? 'pending';
      return current.reviewStatus === filter ? [current] : [];
    });
    const user = userEvent.setup();
    render(<AppReviewSettings />);
    await user.click(screen.getByRole('button', { name: action }));
    await user.click(screen.getByRole('button', { name: confirmation }));
    expect(review).toHaveBeenCalledWith({ appId: 'app-1', status });
    expect(await screen.findByRole('status')).toHaveTextContent(notice);
    expect(screen.getByText('No apps awaiting review.')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: status === 'rejected' ? 'Rejected' : 'Reviewed',
      })
    );
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText(current.reviewStatus)).toBeInTheDocument();
  }
);

it('an administrator saves the hosted brand without changing the exact registered callback', async () => {
  const configure = vi.fn().mockResolvedValue(null);
  vi.mocked(useMutation).mockReturnValue(configure as never);
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { role: 'admin' } : [app]
  );
  const user = userEvent.setup();
  render(<AppReviewSettings />);
  await user.type(screen.getByLabelText('Hosted brand name'), 'Reading Circle');
  await user.type(screen.getByLabelText('Email sender name'), 'Reading Circle');
  await user.clear(screen.getByLabelText('Brand accent'));
  await user.type(screen.getByLabelText('Brand accent'), '#991b1b');
  await user.click(
    screen.getByRole('button', { name: 'Save hosted appearance' })
  );
  expect(configure).toHaveBeenCalledWith({
    appId: 'app-1',
    appearance: {
      brandName: 'Reading Circle',
      senderName: 'Reading Circle',
      accent: '#991b1b',
    },
  });
  expect(
    await screen.findByText('Hosted appearance saved.')
  ).toBeInTheDocument();
  expect(
    screen.getByText('com.example.calendar:/callback')
  ).toBeInTheDocument();
});
