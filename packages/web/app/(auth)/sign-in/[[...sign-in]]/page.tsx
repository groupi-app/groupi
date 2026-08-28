'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signIn,
  sendMagicLinkWithEmailOrUsername,
  authClient,
} from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { LogoSticker } from '@/components/atoms';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { siteConfig } from '@/config/site';
import { useGlobalUser } from '@/context/global-user-context';
import { getMagicLinkCallbackUrl, getSafeInternalRedirect } from '@/lib/urls';

const RESEND_COOLDOWN_SECONDS = 10;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeInternalRedirect(searchParams.get('redirect'));
  const isAddAccountMode = searchParams.get('mode') === 'add-account';
  const oauthError = searchParams.get('error');
  const { isAuthenticated, isLoading: isAuthLoading } = useGlobalUser();

  // Redirect authenticated users away from sign-in (unless adding another account)
  // Redirect unauthenticated users away from add-account mode
  useEffect(() => {
    if (isAuthLoading) return;
    if (isAuthenticated && !isAddAccountMode) {
      router.replace(redirectTo);
    } else if (!isAuthenticated && isAddAccountMode) {
      router.replace('/sign-in');
    }
  }, [isAuthLoading, isAuthenticated, isAddAccountMode, redirectTo, router]);

  // Build callback URL based on mode
  // For add-account mode, go directly to events (they're already onboarded)
  // For regular sign-in, go through onboarding flow
  const callbackURL = isAddAccountMode
    ? redirectTo
    : redirectTo !== '/events'
      ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}`
      : '/onboarding';
  const magicLinkCallbackURL = isAddAccountMode
    ? redirectTo
    : getMagicLinkCallbackUrl(redirectTo);
  const [identifier, setIdentifier] = useState(''); // Email or username
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastSentIdentifier, setLastSentIdentifier] = useState<string | null>(
    null
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Show error from OAuth callback redirect (e.g., account linking failure)
  useEffect(() => {
    if (!oauthError) return;
    const errorMessages: Record<string, string> = {
      account_not_linked:
        'This account is already associated with a different user. Try signing in with a different method.',
      signup_disabled: 'New account registration is currently disabled.',
      unable_to_create_user: 'Unable to create your account. Please try again.',
      unable_to_create_session:
        'Unable to create your session. Please try again.',
    };
    setError(
      errorMessages[oauthError] ||
        'Something went wrong during sign in. Please try again.'
    );
    // Clean the error from the URL without triggering a navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, '', url.toString());
  }, [oauthError]);

  // Check passkey support on mount
  useEffect(() => {
    const checkPasskeySupport = async () => {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        return;
      }
      try {
        const available =
          await PublicKeyCredential.isConditionalMediationAvailable?.();
        // Also check for platform authenticator
        const platformAvailable =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setPasskeySupported(available || platformAvailable);
      } catch {
        setPasskeySupported(false);
      }
    };
    checkPasskeySupport();
  }, []);

  const handleSocialSignIn = async (provider: 'discord' | 'google') => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: '/sign-in',
      });

      if (error) {
        const message = error.message?.toLowerCase() || '';
        // Handle user cancellation gracefully - don't show error
        if (
          message.includes('cancel') ||
          message.includes('closed') ||
          message.includes('denied') ||
          message.includes('access_denied')
        ) {
          // User cancelled the OAuth flow, no need to show error
          return;
        }
        setError(error.message || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        const message = result.error.message?.toLowerCase() || '';
        // Handle user cancellation gracefully - don't show error
        if (
          message.includes('cancel') ||
          message.includes('abort') ||
          message.includes('notallowederror') ||
          message.includes('closed') ||
          message.includes('denied')
        ) {
          return;
        }
        setError(result.error.message || 'Passkey sign-in failed');
        return;
      }

      // Success - redirect to onboarding with redirect parameter
      router.push(callbackURL);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Passkey sign-in failed';
      const lowerMessage = message.toLowerCase();
      // Handle user cancellation gracefully
      if (
        lowerMessage.includes('cancel') ||
        lowerMessage.includes('abort') ||
        lowerMessage.includes('notallowederror') ||
        lowerMessage.includes('closed') ||
        lowerMessage.includes('denied')
      ) {
        // User cancelled, don't show error
        return;
      }
      setError(message);
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [cooldownSeconds]);

  // Show loading state while auth is being determined or when a redirect is imminent
  if (
    isAuthLoading ||
    (isAuthenticated && !isAddAccountMode) ||
    (!isAuthenticated && isAddAccountMode)
  ) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const handleMagicLink = async (e?: React.FormEvent, resend = false) => {
    if (e) {
      e.preventDefault();
    }

    // Check cooldown
    if (cooldownSeconds > 0 && resend) {
      return;
    }

    const identifierToUse =
      resend && lastSentIdentifier ? lastSentIdentifier : identifier;

    if (!identifierToUse) {
      setError('Please enter your email or username');
      return;
    }

    // Check if this is a different identifier than the last one sent
    const isDifferentIdentifier =
      lastSentIdentifier && identifierToUse !== lastSentIdentifier;

    setLoading(true);
    setError('');
    // Reset success state if sending to a different identifier
    if (isDifferentIdentifier || !resend) {
      setSuccess(false);
    }

    try {
      const { error } = await sendMagicLinkWithEmailOrUsername({
        identifier: identifierToUse,
        callbackURL: magicLinkCallbackURL,
      });

      if (error) {
        setError(error.message || 'Unable to send the sign-in link');
        setSuccess(false);
      } else {
        // Success! Show success message
        setSuccess(true);
        setLastSentIdentifier(identifierToUse);
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        if (!resend && !isDifferentIdentifier) {
          setIdentifier(''); // Clear the field only on initial send
        }
      }
    } catch {
      setError('An unexpected error occurred');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldownSeconds === 0 && lastSentIdentifier) {
      handleMagicLink(undefined, true);
    }
  };

  return (
    <div className='container py-12 md:py-20'>
      <div className='flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <div className='flex items-center justify-center gap-2 pt-7 pb-1'>
            <LogoSticker size='xs' color='primary' waving />
            <span className='text-3xl font-bold font-heading text-primary'>
              {siteConfig.name}
            </span>
          </div>

          <div className='px-6 pb-3 text-center'>
            <h1 className='text-2xl font-heading font-semibold'>
              {isAddAccountMode ? 'Add another account' : 'Welcome back'}
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              {isAddAccountMode
                ? 'Sign in with a different account. Your current session will remain active.'
                : 'Plan events together'}
            </p>
          </div>

          <CardContent className='space-y-4'>
            {/* Social Sign In */}
            <div className='space-y-2'>
              <Button
                onClick={() => handleSocialSignIn('discord')}
                className='w-full'
                variant='outline'
                disabled={loading || passkeyLoading}
              >
                <Icons.discord className='size-4 mr-2' />
                Continue with Discord
              </Button>
              <Button
                onClick={() => handleSocialSignIn('google')}
                className='w-full'
                variant='outline'
                disabled={loading || passkeyLoading}
              >
                <Icons.google className='size-4 mr-2' />
                Continue with Google
              </Button>
              {passkeySupported && (
                <Button
                  onClick={handlePasskeySignIn}
                  className='w-full'
                  variant='outline'
                  disabled={loading}
                  isLoading={passkeyLoading}
                  loadingText='Checking passkey…'
                  icon={<Icons.key className='size-4' />}
                >
                  Continue with a passkey
                </Button>
              )}
            </div>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or use email
                </span>
              </div>
            </div>

            {/* Email or username sign-in */}
            <form onSubmit={handleMagicLink} className='space-y-4'>
              <div>
                <Label htmlFor='identifier'>Email or username</Label>
                <Input
                  id='identifier'
                  type='text'
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    // Clear success state when user starts typing a different identifier
                    if (
                      success &&
                      lastSentIdentifier &&
                      e.target.value !== lastSentIdentifier
                    ) {
                      setSuccess(false);
                    }
                  }}
                  placeholder='Enter your email or username'
                  autoComplete='username'
                  required
                  disabled={cooldownSeconds > 0}
                />
              </div>

              {success && (
                <Alert variant='success'>
                  <Icons.mail className='h-4 w-4' />
                  <AlertTitle>Check your email</AlertTitle>
                  <AlertDescription>
                    We sent a sign-in link
                    {lastSentIdentifier ? ` to ${lastSentIdentifier}` : ''}.
                    Open it to continue.
                    {lastSentIdentifier && (
                      <div className='mt-3 pt-3 border-t border-border-success'>
                        <p className='text-sm mb-2'>
                          Didn&apos;t receive the email?
                        </p>
                        {cooldownSeconds > 0 ? (
                          <p className='text-sm text-text-success'>
                            Resend available in {cooldownSeconds} second
                            {cooldownSeconds !== 1 ? 's' : ''}
                          </p>
                        ) : (
                          <button
                            type='button'
                            onClick={handleResend}
                            disabled={loading}
                            className='text-sm font-medium text-text-success hover:text-text-success/80 underline disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            Resend sign-in link
                          </button>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <div className='rounded-lg bg-bg-error-subtle p-4 text-text-error border border-border-error'>
                  <p className='text-sm'>{error}</p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full'
                isLoading={loading}
                loadingText='Sending sign-in link…'
                disabled={passkeyLoading || cooldownSeconds > 0}
              >
                {success ? 'Sign-in link sent' : 'Continue with email'}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground'>
              {isAddAccountMode
                ? 'You can switch between accounts anytime'
                : 'New to Groupi? We’ll create an account automatically.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
