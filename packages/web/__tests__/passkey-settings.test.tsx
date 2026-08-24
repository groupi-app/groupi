import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasskeySettings } from '@/app/(settings)/settings/components/passkey-settings';

const mocks = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  listUserPasskeys: vi.fn(),
  deletePasskey: vi.fn(),
  updatePasskey: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    passkey: {
      addPasskey: mocks.addPasskey,
      listUserPasskeys: mocks.listUserPasskeys,
      deletePasskey: mocks.deletePasskey,
      updatePasskey: mocks.updatePasskey,
    },
  },
  signOut: mocks.signOut,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('PasskeySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listUserPasskeys.mockResolvedValue({ data: [] });
    mocks.signOut.mockResolvedValue({ data: null, error: null });

    class MockPublicKeyCredential {
      static isUserVerifyingPlatformAuthenticatorAvailable = vi
        .fn()
        .mockResolvedValue(true);
    }

    vi.stubGlobal('PublicKeyCredential', MockPublicKeyCredential);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for reauthentication when passkey registration needs a fresh session', async () => {
    mocks.addPasskey.mockResolvedValue({
      error: {
        code: 'SESSION_NOT_FRESH',
        message: 'Session is not fresh',
      },
    });

    const user = userEvent.setup();
    render(<PasskeySettings />);

    await user.click(
      await screen.findByRole('button', { name: 'Add Passkey' })
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Sign in again to add a passkey',
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in again' }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledOnce();
      expect(mocks.push).toHaveBeenCalledWith(
        '/sign-in?redirect=%2Fsettings%2Faccount'
      );
    });
  });
});
