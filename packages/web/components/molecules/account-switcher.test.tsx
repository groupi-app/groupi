import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSwitcher } from './account-switcher';
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  setActive: vi.fn().mockResolvedValue({}),
  current: {
    user: { id: 'alice', email: 'alice@example.test' },
    session: { token: 'alice-session' },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock('@/env.mjs', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://ui.example' },
}));
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: mocks.current }),
  authClient: {
    multiSession: {
      listDeviceSessions: vi.fn().mockResolvedValue({
        data: [
          {
            token: 'alice-session',
            user: { id: 'alice', email: 'alice@example.test', name: 'Alice' },
          },
          {
            token: 'bob-session',
            user: { id: 'bob', email: 'bob@example.test', name: 'Bob' },
          },
        ],
      }),
      setActive: mocks.setActive,
      revoke: vi.fn(),
    },
  },
}));
it('explicitly chooses an existing account and resumes the exact hosted consent', async () => {
  const user = userEvent.setup();
  render(<AccountSwitcher returnTo='/oauth/consent?interactionId=trusted' />);
  await user.click(await screen.findByRole('button', { name: /Bob/ }));
  expect(mocks.setActive).toHaveBeenCalledWith({ sessionToken: 'bob-session' });
  expect(mocks.push).toHaveBeenCalledWith(
    '/oauth/consent?interactionId=trusted'
  );
});
it('adding another identity retains the exact hosted continuation', async () => {
  const user = userEvent.setup();
  render(<AccountSwitcher returnTo='/oauth/consent?interactionId=trusted' />);
  await user.click(
    await screen.findByRole('button', { name: 'Add another account' })
  );
  expect(mocks.push).toHaveBeenCalledWith(
    '/sign-in?mode=add-account&redirect=%2Foauth%2Fconsent%3FinteractionId%3Dtrusted'
  );
});
