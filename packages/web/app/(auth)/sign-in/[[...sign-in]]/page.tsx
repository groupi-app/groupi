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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

const RESEND_COOLDOWN_SECONDS = 10;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/events';
  // Build callback URL that includes the redirect parameter for onboarding
  const callbackURL =
    redirectTo !== '/events'
      ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}`
      : '/onboarding';
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
        setError(result.error.message || 'Passkey authentication failed');
        return;
      }

      // Success - redirect to onboarding with redirect parameter
      router.push(callbackURL);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Passkey authentication failed';
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
        callbackURL,
      });

      if (error) {
        setError(error.message || 'Failed to send magic link');
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
    <div className='container py-24'>
      <div className='flex justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
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
                  loadingText='Authenticating...'
                  icon={<Icons.fingerprint className='size-4' />}
                >
                  Sign in with Passkey
                </Button>
              )}
            </div>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            {/* Magic Link with Email or Username */}
            <form onSubmit={handleMagicLink} className='space-y-4'>
              <div>
                <Label htmlFor='identifier'>Email or Username</Label>
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
                  required
                  disabled={cooldownSeconds > 0}
                />
              </div>

              {success && (
                <Alert variant='success'>
                  <Icons.mail className='h-4 w-4' />
                  <AlertTitle>Check your email!</AlertTitle>
                  <AlertDescription>
                    We&apos;ve sent you a magic link to sign in. Click the link
                    in the email to continue.
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
                            Resend magic link
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
                loadingText='Sending...'
                disabled={passkeyLoading || cooldownSeconds > 0}
              >
                {success && identifier === lastSentIdentifier
                  ? 'Link Sent!'
                  : 'Send Magic Link'}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground'>
              New users will be automatically registered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
