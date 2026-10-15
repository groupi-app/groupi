import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from 'convex/react';
import SignInPage from '@/app/(auth)/sign-in/[[...sign-in]]/page';
const mocks = vi.hoisted(() => ({
  params: new URLSearchParams({
    redirect: '/oauth/consent?interactionId=trusted',
  }),
  replace: vi.fn(),
  send: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.params,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/env.mjs', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://ui.example' },
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ isAuthenticated: false, isLoading: false }),
}));
vi.mock('@/lib/auth-client', () => ({
  sendMagicLinkWithEmailOrUsername: mocks.send,
  signIn: { social: vi.fn() },
  authClient: {},
}));
vi.mock('@/convex/_generated/api', () => ({
  api: { delegatedApps: { hosted: { getAppearance: 'appearance' } } },
}));
beforeEach(() => {
  mocks.params = new URLSearchParams({
    redirect: '/oauth/consent?interactionId=trusted',
  });
  mocks.send.mockResolvedValue({ error: null });
  vi.mocked(useQuery).mockReturnValue({
    appName: 'Red Room',
    providerName: 'Groupi',
    appearance: {
      brandName: 'Red Room',
      senderName: 'Red Room',
      accent: '#991b1b',
    },
  });
});
it('hosted email sign-in keeps the consent interaction in the verification callback', async () => {
  const user = userEvent.setup();
  render(<SignInPage />);
  expect(screen.getByRole('heading', { name: 'Red Room' })).toBeInTheDocument();
  await user.type(
    screen.getByPlaceholderText('Enter your email or username'),
    'visitor@example.test'
  );
  await user.click(screen.getByRole('button', { name: 'Continue with email' }));
  expect(mocks.send).toHaveBeenCalledWith({
    identifier: 'visitor@example.test',
    errorCallbackURL:
      '/sign-in?redirect=%252Foauth%252Fconsent%253FinteractionId%253Dtrusted',
    callbackURL:
      '/onboarding?redirect=%252Foauth%252Fconsent%253FinteractionId%253Dtrusted',
  });
  expect(await screen.findByText('Check your email')).toBeInTheDocument();
});
it('expired or used magic links explain recovery in the initiating browser', () => {
  mocks.params.set('error', 'INVALID_TOKEN');
  render(<SignInPage />);
  expect(screen.getByText(/expired or was already used/)).toBeInTheDocument();
});

it('an expired active account preserves the hosted request while leaving add-account mode', () => {
  mocks.params.set('mode', 'add-account');
  render(<SignInPage />);
  expect(mocks.replace).toHaveBeenCalledWith(
    '/sign-in?redirect=%2Foauth%2Fconsent%3FinteractionId%3Dtrusted'
  );
});

it('keeps the expired-link explanation when the account-selection session has also expired', () => {
  mocks.params.set('mode', 'add-account');
  mocks.params.set('error', 'INVALID_TOKEN');
  render(<SignInPage />);
  expect(mocks.replace).toHaveBeenCalledWith(
    '/sign-in?redirect=%2Foauth%2Fconsent%3FinteractionId%3Dtrusted&error=INVALID_TOKEN'
  );
});
