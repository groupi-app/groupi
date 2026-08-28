import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendVerificationOtp: vi.fn(),
  magicLink: vi.fn(),
  emailOtp: vi.fn(),
  social: vi.fn(),
  query: vi.fn(),
  getSession: vi.fn(),
  persistCallbackCookies: vi.fn(),
}));

vi.mock('./auth-client', () => ({
  authClient: {
    emailOtp: { sendVerificationOtp: mocks.sendVerificationOtp },
    signIn: {
      magicLink: mocks.magicLink,
      emailOtp: mocks.emailOtp,
      social: mocks.social,
    },
    getSession: mocks.getSession,
  },
}));

vi.mock('./native-auth', () => ({
  persistNativeAuthCallbackCookies: mocks.persistCallbackCookies,
}));

vi.mock('./convex', () => ({
  convex: { query: mocks.query },
}));

vi.mock('convex/_generated/api', () => ({
  api: { auth: { queries: { getEmailForUsername: 'getEmailForUsername' } } },
}));

import {
  completeNativeAuthCallback,
  requestNativeSignIn,
  signInWithNativeSocial,
  verifyNativeEmailOtp,
} from './native-auth-actions';

describe('native Better Auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendVerificationOtp.mockResolvedValue({ error: null });
    mocks.magicLink.mockResolvedValue({ error: null });
    mocks.emailOtp.mockResolvedValue({ error: null });
    mocks.social.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({
      data: { session: { id: 'session-1' } },
    });
    mocks.query.mockResolvedValue(null);
    mocks.persistCallbackCookies.mockResolvedValue(undefined);
  });

  it('requests both an OTP and a native-returning magic link', async () => {
    await expect(
      requestNativeSignIn(
        'person@example.test',
        '/callback?returnTo=%2Fnotifications'
      )
    ).resolves.toEqual({ success: true, email: 'person@example.test' });

    expect(mocks.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'person@example.test',
      type: 'sign-in',
    });
    expect(mocks.magicLink).toHaveBeenCalledWith({
      email: 'person@example.test',
      callbackURL: '/callback?returnTo=%2Fnotifications',
    });
  });

  it('resolves a username before requesting the email sign-in methods', async () => {
    mocks.query.mockResolvedValue({ email: 'person@example.test' });

    await expect(
      requestNativeSignIn('groupi_user', '/callback')
    ).resolves.toEqual({ success: true, email: 'person@example.test' });

    expect(mocks.query).toHaveBeenCalledWith('getEmailForUsername', {
      username: 'groupi_user',
    });
    expect(mocks.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'person@example.test',
      type: 'sign-in',
    });
    expect(mocks.magicLink).toHaveBeenCalledWith({
      email: 'person@example.test',
      callbackURL: '/callback',
    });
  });

  it('does not send an email when a username cannot be found', async () => {
    await expect(
      requestNativeSignIn('missing_user', '/callback')
    ).resolves.toEqual({
      success: false,
      message: "We couldn't find that username",
    });

    expect(mocks.sendVerificationOtp).not.toHaveBeenCalled();
    expect(mocks.magicLink).not.toHaveBeenCalled();
  });

  it('uses the Expo-aware Better Auth client for OTP sign in', async () => {
    await expect(
      verifyNativeEmailOtp('person@example.test', '123456')
    ).resolves.toEqual({ success: true });

    expect(mocks.emailOtp).toHaveBeenCalledWith({
      email: 'person@example.test',
      otp: '123456',
    });
    expect(mocks.getSession).toHaveBeenCalledOnce();
  });

  it('uses the Expo-aware social flow and its callback URL', async () => {
    await expect(
      signInWithNativeSocial('google', '/callback')
    ).resolves.toEqual({ success: true });

    expect(mocks.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/callback',
    });
    expect(mocks.getSession).toHaveBeenCalledOnce();
  });

  it('does not report OAuth success when the browser returns no session', async () => {
    mocks.getSession.mockResolvedValue({ data: null });

    await expect(
      signInWithNativeSocial('discord', '/callback')
    ).resolves.toEqual({
      success: false,
      message: 'Authentication was not completed',
    });
  });

  it('persists a magic-link callback before refreshing the session', async () => {
    await expect(
      completeNativeAuthCallback('better-auth.session_token=token')
    ).resolves.toEqual({ success: true });

    expect(mocks.persistCallbackCookies).toHaveBeenCalledWith(
      'better-auth.session_token=token'
    );
    expect(
      mocks.persistCallbackCookies.mock.invocationCallOrder[0]
    ).toBeLessThan(mocks.getSession.mock.invocationCallOrder[0]);
  });
});
