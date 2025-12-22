'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signIn, sendMagicLinkWithEmailOrUsername } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

const RESEND_COOLDOWN_SECONDS = 10;

export default function SignInPage() {
  const [identifier, setIdentifier] = useState(''); // Email or username
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastSentIdentifier, setLastSentIdentifier] = useState<string | null>(
    null
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSocialSignIn = async (provider: 'discord' | 'google') => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn.social({
        provider,
        callbackURL: '/onboarding',
      });

      if (error) {
        setError(error.message || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
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
        callbackURL: '/onboarding',
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
                disabled={loading}
              >
                <Icons.discord className='size-4 mr-2' />
                Continue with Discord
              </Button>
              <Button
                onClick={() => handleSocialSignIn('google')}
                className='w-full'
                variant='outline'
                disabled={loading}
              >
                <Icons.google className='size-4 mr-2' />
                Continue with Google
              </Button>
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
                <Alert className='border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'>
                  <Icons.mail className='h-4 w-4 text-green-600 dark:text-green-400' />
                  <AlertTitle className='text-green-900 dark:text-green-100'>
                    Check your email!
                  </AlertTitle>
                  <AlertDescription className='text-green-800 dark:text-green-200'>
                    We&apos;ve sent you a magic link to sign in. Click the link
                    in the email to continue.
                    {lastSentIdentifier && (
                      <div className='mt-3 pt-3 border-t border-green-200 dark:border-green-800'>
                        <p className='text-sm mb-2'>
                          Didn&apos;t receive the email?
                        </p>
                        {cooldownSeconds > 0 ? (
                          <p className='text-sm text-green-700 dark:text-green-300'>
                            Resend available in {cooldownSeconds} second
                            {cooldownSeconds !== 1 ? 's' : ''}
                          </p>
                        ) : (
                          <button
                            type='button'
                            onClick={handleResend}
                            disabled={loading}
                            className='text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline disabled:opacity-50 disabled:cursor-not-allowed'
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
                <div className='rounded-lg bg-red-50 p-4 text-red-800 border border-red-200'>
                  <p className='text-sm'>{error}</p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full'
                disabled={loading || cooldownSeconds > 0}
              >
                {loading
                  ? 'Sending...'
                  : success && identifier === lastSentIdentifier
                    ? 'Link Sent!'
                    : 'Send Magic Link'}
              </Button>
            </form>

            <div className='text-center text-sm text-muted-foreground'>
              Don&apos;t have an account?{' '}
              <Link href='/sign-up' className='underline'>
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
