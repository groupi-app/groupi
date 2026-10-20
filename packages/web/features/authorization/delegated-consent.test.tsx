import { expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { DelegatedConsent } from './delegated-consent';
vi.mock('@/convex/_generated/api', () => ({
  api: {
    auth: { queries: { getCurrentUser: 'current-user' } },
    delegatedApps: {
      queries: { getConsentRequest: 'request' },
      mutations: { approveConsent: 'approve', denyConsent: 'deny' },
    },
  },
}));
it('shows the exact requested actions checked and disabled without granting before Allow', async () => {
  mockConsent(consentRequest());
  const approve = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  const requested = screen.getByRole('group', { name: 'Requested actions' });
  expect(requested.querySelectorAll('[role=checkbox]')).toHaveLength(2);
  for (const name of ['Read your email address', 'Read events']) {
    const checkbox = screen.getByRole('checkbox', { name });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  }
  expect(approve).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeDisabled();
  expect(screen.getByLabelText('Allow background access')).not.toBeChecked();
  await user.click(screen.getByLabelText('Dinner'));
  expect(approve).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledExactlyOnceWith({
    interactionId: 'i-1',
    actions: ['identity.email', 'events.read'],
    selector: { kind: 'selected', eventIds: ['e-1'] },
    background: false,
  });
});

it('requires explicit background consent and shows the instance, account, app and bounds', async () => {
  mockConsent({
    interactionId: 'i-1',
    instance: 'https://groupi.example',
    appId: 'app-1',
    appName: 'Calendar',
    purpose: 'Show events',
    requestedScopes: ['openid', 'events.read', 'offline_access'],
    requestedActions: ['events.read'],
    account: { displayName: 'Alice' },
    events: [{ _id: 'e-1', title: 'Dinner' }],
    expiresAt: Date.now() + 60000,
  });
  const approve = vi.fn().mockRejectedValue(new Error('Interaction expired'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByText('https://groupi.example')).toBeInTheDocument();
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Connect Calendar' })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Allow background access')).not.toBeChecked();
  await user.click(screen.getByLabelText('Dinner'));
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledWith({
    interactionId: 'i-1',
    actions: ['events.read'],
    selector: { kind: 'selected', eventIds: ['e-1'] },
    background: false,
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Interaction expired'
  );
});

const consentRequest = () => ({
  interactionId: 'i-1',
  instance: 'https://groupi.example',
  appId: 'app-1',
  appName: 'Calendar',
  purpose: 'Show events',
  requestedScopes: [
    'openid',
    'identity.email',
    'events.read',
    'offline_access',
  ],
  requestedActions: ['identity.email', 'events.read'],
  account: { displayName: 'Alice' },
  events: [{ _id: 'e-1', title: 'Dinner' }],
  expiresAt: Date.now() + 60000,
});
function mockConsent(request: ReturnType<typeof consentRequest>) {
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { _id: 'account-a' } : request
  );
}
it('keeps pure openid sign-in free of event selectors and submits empty event bounds', async () => {
  mockConsent({
    ...consentRequest(),
    requestedScopes: ['openid'],
    requestedActions: [],
  });
  const approve = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.queryByText('Event access')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledWith({
    interactionId: 'i-1',
    actions: [],
    selector: { kind: 'selected', eventIds: [] },
    background: false,
  });
});
it('resets optional resource and background choices when the request changes', async () => {
  let request = consentRequest();
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { _id: 'account-a' } : request
  );
  const user = userEvent.setup();
  const view = render(<DelegatedConsent interactionId='i-1' />);
  await user.click(screen.getByLabelText('Dinner'));
  await user.click(screen.getByLabelText('Allow background access'));
  request = {
    ...request,
    requestedScopes: ['openid', 'identity.email'],
    requestedActions: ['identity.email'],
  };
  view.rerender(<DelegatedConsent interactionId='i-1' />);
  expect(screen.queryByText('Event access')).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText('Allow background access')
  ).not.toBeInTheDocument();
  request = consentRequest();
  view.rerender(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByLabelText('Dinner')).not.toBeChecked();
  expect(screen.getByLabelText('Allow background access')).not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeDisabled();
});

it('discards choices when the authenticated account changes even if its display name is identical', async () => {
  let accountId = 'account-a';
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never)
      ? { _id: accountId }
      : consentRequest()
  );
  const user = userEvent.setup();
  const view = render(<DelegatedConsent interactionId='i-1' />);
  await user.click(
    screen.getByLabelText(
      'All current and future events within my current authority'
    )
  );
  await user.click(screen.getByLabelText('Allow background access'));
  accountId = 'account-b';
  view.rerender(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByLabelText('Read events')).toBeChecked();
  expect(screen.getByLabelText('Read events')).toBeDisabled();
  expect(screen.getByLabelText('Allow background access')).not.toBeChecked();
  expect(screen.getByLabelText('Dinner')).not.toBeChecked();
  expect(
    screen.getByLabelText(
      'All current and future events within my current authority'
    )
  ).not.toBeChecked();
});

it('replaces an expired open consent form with restart guidance when its deadline passes', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-01-01T12:00:00Z'));
  mockConsent({ ...consentRequest(), expiresAt: Date.now() + 1000 });
  const view = render(<DelegatedConsent interactionId='i-1' />);
  try {
    expect(
      screen.getByRole('button', { name: 'Allow access' })
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Return to the app and start sign-in again'
    );
    expect(
      screen.queryByRole('button', { name: 'Allow access' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Deny' })
    ).not.toBeInTheDocument();
  } finally {
    view.unmount();
    vi.useRealTimers();
  }
});

it('branded consent still discloses provider, Developer app and unambiguous account with explicit switching', () => {
  const request = {
    ...consentRequest(),
    appearance: {
      brandName: 'Reading Circle',
      senderName: 'Reading Circle',
      accent: '#991b1b',
    },
    account: {
      displayName: 'Alice',
      username: 'nightowl',
      email: 'alice@example.test',
    },
  };
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('current-user' as never) ? { _id: 'account-a' } : request
  );
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByText('Reading Circle')).toBeInTheDocument();
  expect(screen.getByText('Sign-in provided by Groupi')).toBeInTheDocument();
  expect(screen.getByText('Developer app: Calendar')).toBeInTheDocument();
  expect(screen.getByText('alice@example.test')).toBeInTheDocument();
  expect(screen.getByText('@nightowl')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Choose another account' })
  ).toHaveAttribute(
    'href',
    '/sign-in?mode=add-account&redirect=%2Foauth%2Fconsent%3FinteractionId%3Di-1'
  );
});

it('discloses only the selected Group and future audience boundary for applicants', async () => {
  mockConsent({
    ...consentRequest(),
    selectedGroup: { id: 'g-community', name: 'Reading Circle' },
    requestedScopes: ['openid', 'groups.context.read'],
    requestedActions: ['groups.context.read'],
    events: [],
  } as ReturnType<typeof consentRequest>);
  const approve = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByText('Reading Circle')).toBeInTheDocument();
  expect(
    screen.getByText(/current and future Events shared with this Group/)
  ).toBeInTheDocument();
  expect(screen.queryByText('Event access')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledWith({
    interactionId: 'i-1',
    actions: ['groups.context.read'],
    selector: { kind: 'selected-group', groupId: 'g-community' },
    background: false,
  });
});

it('consents to a selected Group write without requiring own-context read', async () => {
  mockConsent({
    ...consentRequest(),
    selectedGroup: { id: 'g-community', name: 'Reading Circle' },
    requestedScopes: ['openid', 'groups.applications.submit'],
    requestedActions: ['groups.applications.submit'],
    events: [],
  } as ReturnType<typeof consentRequest>);
  const approve = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.queryByText('Event access')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledWith({
    interactionId: 'i-1',
    actions: ['groups.applications.submit'],
    selector: { kind: 'selected-group', groupId: 'g-community' },
    background: false,
  });
});

it('Deny cancels without granting actions or requiring resource selection', async () => {
  mockConsent(consentRequest());
  const approve = vi.fn();
  const deny = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockImplementation(
    reference => (reference === ('approve' as never) ? approve : deny) as never
  );
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeDisabled();
  expect(deny).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Deny' }));
  expect(deny).toHaveBeenCalledExactlyOnceWith({ interactionId: 'i-1' });
  expect(approve).not.toHaveBeenCalled();
});

it('grants background and all-event access only after their separate opt-ins and Allow', async () => {
  mockConsent(consentRequest());
  const approve = vi.fn().mockRejectedValue(new Error('Stop continuation'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  const allEvents = screen.getByLabelText(
    'All current and future events within my current authority'
  );
  const background = screen.getByLabelText('Allow background access');
  expect(allEvents).not.toBeChecked();
  expect(background).not.toBeChecked();
  await user.click(allEvents);
  await user.click(background);
  expect(approve).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledExactlyOnceWith({
    interactionId: 'i-1',
    actions: ['identity.email', 'events.read'],
    selector: { kind: 'all-current-and-future' },
    background: true,
  });
});
