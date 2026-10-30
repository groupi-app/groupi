import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { OnboardingContent } from '@/app/(auth)/onboarding/onboarding-content';
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams({
    redirect: '/oauth/consent?interactionId=trusted',
  }),
}));
vi.mock('@/env.mjs', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://ui.example' },
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.params,
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('@/convex/_generated/api', () => ({
  api: {
    users: {
      mutations: { completeOnboarding: 'complete' },
      queries: { checkUsernameAvailability: 'availability' },
    },
    auth: { queries: { getCurrentUser: 'account' } },
    delegatedApps: { hosted: { getAppearance: 'appearance' } },
  },
}));
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    query = vi.fn().mockResolvedValue({ available: true });
  },
}));
it('a hosted new account needs only a pseudonymous username and returns to its bound consent', async () => {
  const complete = vi.fn().mockResolvedValue(null);
  vi.mocked(useMutation).mockReturnValue(complete as never);
  vi.mocked(useQuery).mockImplementation((...args) =>
    args[0] === ('appearance' as never)
      ? {
          appName: 'Reading Circle',
          providerName: 'Groupi',
          appearance: {
            brandName: 'Reading Circle',
            accent: '#991b1b',
            senderName: 'Reading Circle',
          },
        }
      : { name: 'visitor@example.test' }
  );
  const user = userEvent.setup();
  render(<OnboardingContent />);
  expect(
    screen.getByRole('heading', { name: 'Choose a pseudonymous username' })
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Display Name')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Username *'), 'nightowl');
  await user.click(screen.getByRole('button', { name: 'Complete Setup' }));
  expect(complete).toHaveBeenCalledWith({
    username: 'nightowl',
    displayName: 'nightowl',
    pronouns: undefined,
    bio: undefined,
  });
  expect(mocks.push).toHaveBeenCalledWith(
    '/oauth/consent?interactionId=trusted'
  );
});
