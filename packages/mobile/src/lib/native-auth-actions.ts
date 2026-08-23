import { authClient } from './auth-client';
import { persistNativeAuthCallbackCookies } from './native-auth';

export type NativeAuthActionResult =
  | { success: true }
  | { success: false; message: string };

export async function requestNativeSignInEmail(
  email: string,
  callbackURL: string
): Promise<NativeAuthActionResult> {
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
  return { success: true };
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
