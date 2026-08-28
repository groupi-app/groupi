import { authClient } from './auth-client';
import { convex } from './convex';
import { persistNativeAuthCallbackCookies } from './native-auth';
import { api } from 'convex/_generated/api';

export type NativeAuthActionResult =
  | { success: true }
  | { success: false; message: string };

export type NativeEmailRequestResult =
  | { success: true; email: string }
  | { success: false; message: string };

async function resolveSignInEmail(identifier: string) {
  if (identifier.includes('@')) return identifier;

  try {
    const result = await convex.query(api.auth.queries.getEmailForUsername, {
      username: identifier,
    });
    return result?.email ?? null;
  } catch {
    throw new Error('Unable to look up that username. Try again.');
  }
}

export async function requestNativeSignIn(
  identifier: string,
  callbackURL: string
): Promise<NativeEmailRequestResult> {
  let email: string | null;

  try {
    email = await resolveSignInEmail(identifier.trim());
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unable to look up that username. Try again.',
    };
  }

  if (!email) {
    return { success: false, message: "We couldn't find that username" };
  }

  const [otpResult] = await Promise.allSettled([
    authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    }),
    authClient.signIn.magicLink({ email, callbackURL }),
  ]);

  if (otpResult.status === 'rejected') {
    return { success: false, message: 'Failed to send code' };
  }
  if (otpResult.value.error) {
    return {
      success: false,
      message: otpResult.value.error.message || 'Failed to send code',
    };
  }
  return { success: true, email };
}

export async function verifyNativeEmailOtp(
  email: string,
  otp: string
): Promise<NativeAuthActionResult> {
  const result = await authClient.signIn.emailOtp({ email, otp });
  if (result.error) {
    return {
      success: false,
      message: result.error.message || 'Invalid code',
    };
  }

  const session = await authClient.getSession();
  return session.data?.session
    ? { success: true }
    : {
        success: false,
        message: 'Sign in could not be completed. Please try again.',
      };
}

export async function signInWithNativeSocial(
  provider: 'discord' | 'google',
  callbackURL: string
): Promise<NativeAuthActionResult> {
  const result = await authClient.signIn.social({ provider, callbackURL });
  if (result.error) {
    return {
      success: false,
      message: result.error.message || 'Authentication was not completed',
    };
  }

  const session = await authClient.getSession();
  return session.data?.session
    ? { success: true }
    : { success: false, message: 'Authentication was not completed' };
}

export async function completeNativeAuthCallback(
  cookieHeader: string
): Promise<NativeAuthActionResult> {
  try {
    await persistNativeAuthCallbackCookies(cookieHeader);
    const session = await authClient.getSession();
    return session.data?.session
      ? { success: true }
      : { success: false, message: 'Authentication session was not created' };
  } catch {
    return { success: false, message: 'Authentication callback failed' };
  }
}
