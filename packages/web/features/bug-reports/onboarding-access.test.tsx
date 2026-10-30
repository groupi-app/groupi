import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { OnboardingRedirectWrapper } from '@/components/onboarding-redirect-wrapper';
vi.mock('@/env.mjs', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://ui.example' },
}));
const state = vi.hoisted(() => ({ path: '/report-bug', push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => state.path,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: state.push }),
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({
    session: { user: { id: 'incomplete' } },
    isSessionPending: false,
    needsOnboarding: true,
  }),
}));
it.each(['/report-bug', '/support'])(
  'keeps support reachable for incomplete profiles: %s',
  path => {
    state.path = path;
    state.push.mockClear();
    render(<OnboardingRedirectWrapper />);
    expect(state.push).not.toHaveBeenCalled();
  }
);
