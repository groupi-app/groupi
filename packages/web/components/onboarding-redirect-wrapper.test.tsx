import { expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { OnboardingRedirectWrapper } from './onboarding-redirect-wrapper';
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
  usePathname: () => '/onboarding',
  useSearchParams: () => mocks.params,
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({
    session: null,
    isSessionPending: false,
    needsOnboarding: null,
  }),
}));
it('expired onboarding sessions restart sign-in with the exact safe hosted continuation', () => {
  render(<OnboardingRedirectWrapper />);
  expect(mocks.push).toHaveBeenCalledWith(
    '/sign-in?redirect=%2Foauth%2Fconsent%3FinteractionId%3Dtrusted'
  );
});
