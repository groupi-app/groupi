import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CliAuthPage from '@/app/(auth)/cli-auth/page';

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  authorize: vi.fn(),
  navigate: vi.fn(),
  user: {
    isAuthenticated: true,
    isLoading: false,
    needsOnboarding: false,
    user: { email: 'owner@example.test', name: 'Owner' },
  },
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.params,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => mocks.user,
}));
vi.mock('convex/react', () => ({ useMutation: () => mocks.authorize }));
vi.mock('@/convex/_generated/api', () => ({
  api: { cliAuth: { mutations: { authorize: 'authorize' } } },
}));
vi.mock('@/lib/cli-auth', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/cli-auth')>()),
  navigateToCli: mocks.navigate,
}));
const state = 'a'.repeat(43);
const challenge = 'b'.repeat(43);
const valid = () =>
  new URLSearchParams({ callbackPort: '54321', state, challenge });

describe('CLI browser authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = valid();
    mocks.user.isAuthenticated = true;
    mocks.user.isLoading = false;
    mocks.user.needsOnboarding = false;
    mocks.authorize.mockResolvedValue({
      code: 'one-use-code',
      expiresAt: Date.now() + 60000,
    });
  });

  it.each([
    '',
    '0',
    '65536',
    '080',
    '-1',
    '80@evil.test',
    '80/path',
    '1e3',
    '80.0',
  ])('rejects callback port %s before authorization or redirect', port => {
    mocks.params.set('callbackPort', port);
    render(<CliAuthPage />);
    expect(screen.getByText('Invalid CLI sign-in request')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Authorize CLI' })
    ).not.toBeInTheDocument();
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it.each(['state', 'challenge'])(
    'rejects a missing or malformed %s',
    field => {
      mocks.params.set(field, 'bad');
      render(<CliAuthPage />);
      expect(
        screen.getByText('Invalid CLI sign-in request')
      ).toBeInTheDocument();
    }
  );
  it('rejects ambiguous duplicate parameters', () => {
    mocks.params.append('callbackPort', '80');
    render(<CliAuthPage />);
    expect(screen.getByText('Invalid CLI sign-in request')).toBeInTheDocument();
  });
  it.each(['callbackPort', 'state', 'challenge'])(
    'rejects a missing %s',
    field => {
      mocks.params.delete(field);
      render(<CliAuthPage />);
      expect(
        screen.getByText('Invalid CLI sign-in request')
      ).toBeInTheDocument();
      expect(mocks.authorize).not.toHaveBeenCalled();
    }
  );
  it('waits for the account to load before allowing consent', () => {
    mocks.user.isLoading = true;
    render(<CliAuthPage />);
    expect(
      screen.queryByRole('button', { name: 'Authorize CLI' })
    ).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.authorize).not.toHaveBeenCalled();
  });
  it('does not create multiple grants while authorization is pending', () => {
    mocks.authorize.mockReturnValue(new Promise(() => {}));
    render(<CliAuthPage />);
    const button = screen.getByRole('button', { name: 'Authorize CLI' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.authorize).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
  it.each([false, true])(
    'preserves the validated flow through sign-in/onboarding (signed in: %s)',
    signedIn => {
      mocks.user.isAuthenticated = signedIn;
      mocks.user.needsOnboarding = signedIn;
      render(<CliAuthPage />);
      const destination = new URL(
        mocks.replace.mock.calls[0][0],
        'https://groupi.gg'
      );
      expect(destination.pathname).toBe(signedIn ? '/onboarding' : '/sign-in');
      const returnUrl = new URL(
        destination.searchParams.get('redirect')!,
        'https://groupi.gg'
      );
      expect(returnUrl.pathname).toBe('/cli-auth');
      expect(returnUrl.searchParams.toString()).toBe(valid().toString());
      expect(mocks.authorize).not.toHaveBeenCalled();
    }
  );
  it('requires account consent and hands off only a code without announcing successful connection', async () => {
    render(<CliAuthPage />);
    expect(screen.getByText('owner@example.test')).toBeInTheDocument();
    expect(mocks.authorize).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Authorize CLI' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.authorize).toHaveBeenCalledWith({
      callbackPort: 54321,
      state,
      challenge,
    });
    const callback = new URL(mocks.navigate.mock.calls[0][0]);
    expect(callback.origin).toBe('http://127.0.0.1:54321');
    expect(callback.pathname).toBe('/callback');
    expect(callback.searchParams.get('code')).toBe('one-use-code');
    expect(callback.searchParams.get('state')).toBe(state);
    expect(callback.searchParams.has('apiKey')).toBe(false);
    expect(screen.getByText('Return to your terminal')).toBeInTheDocument();
    expect(
      screen.queryByText(
        /CLI Authenticated|terminal is now connected|one-use-code/
      )
    ).not.toBeInTheDocument();
  });
  it('sends cancellation only to the validated loopback listener', () => {
    render(<CliAuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const callback = new URL(mocks.navigate.mock.calls[0][0]);
    expect(callback.origin).toBe('http://127.0.0.1:54321');
    expect(callback.searchParams.get('error')).toBe('access_denied');
    expect(callback.searchParams.get('state')).toBe(state);
    expect(mocks.authorize).not.toHaveBeenCalled();
  });
  it('shows a recoverable error without leaking backend error details', async () => {
    mocks.authorize.mockRejectedValue(new Error('secret-internal-detail'));
    render(<CliAuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Authorize CLI' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(
      screen.queryByText(/secret-internal-detail/)
    ).not.toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Authorize CLI' })).toBeEnabled();
  });
});
