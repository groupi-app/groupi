'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useGlobalUser } from '@/context/global-user-context';
import { siteConfig } from '@/config/site';

export default function CliAuthPage() {
  const searchParams = useSearchParams();
  const callbackPort = searchParams.get('callbackPort');
  const { isAuthenticated, isLoading: isAuthLoading } = useGlobalUser();

  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      const returnUrl = `/cli-auth${callbackPort ? `?callbackPort=${callbackPort}` : ''}`;
      window.location.href = `/sign-in?redirect=${encodeURIComponent(returnUrl)}`;
    }
  }, [isAuthLoading, isAuthenticated, callbackPort]);

  const handleAuthorize = useCallback(async () => {
    setAuthorizing(true);
    setError('');

    try {
      const expiresIn = 90 * 24 * 60 * 60; // 90 days
      const result = await authClient.apiKey.create({
        name: `Groupi CLI (${new Date().toLocaleDateString()})`,
        expiresIn,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create API key');
        setAuthorizing(false);
        return;
      }

      const apiKey = result.data?.key;
      if (!apiKey) {
        setError('No API key returned');
        setAuthorizing(false);
        return;
      }

      setGeneratedKey(apiKey);

      if (callbackPort) {
        const callbackUrl = `http://127.0.0.1:${callbackPort}/callback?apiKey=${encodeURIComponent(apiKey)}`;
        setRedirected(true);
        window.location.href = callbackUrl;
        return;
      }

      setAuthorizing(false);
    } catch {
      setError('An unexpected error occurred');
      setAuthorizing(false);
    }
  }, [callbackPort]);

  const handleCopy = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAuthLoading || (!isAuthenticated && !error)) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (redirected) {
    return (
      <div className='container py-12 md:py-24'>
        <div className='flex flex-col items-center justify-center gap-8'>
          <Card className='w-full max-w-md'>
            <CardContent className='pt-6 text-center space-y-4'>
              <div className='size-16 mx-auto rounded-avatar bg-bg-success-subtle flex items-center justify-center'>
                <Icons.check className='size-8 text-success' />
              </div>
              <h1 className='text-xl font-heading font-medium'>
                CLI Authenticated
              </h1>
              <p className='text-muted-foreground'>
                Your terminal is now connected. You can close this tab.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='container py-12 md:py-24'>
      <div className='flex flex-col items-center justify-center gap-8'>
        <Card className='w-full max-w-md'>
          <div className='flex items-center justify-center gap-2 pt-6 pb-2'>
            <Icons.logo
              width='32'
              height='28'
              viewBox='0 0 197 225'
              className='text-primary'
            />
            <span className='text-2xl font-bold font-heading'>
              {siteConfig.name}
            </span>
          </div>

          <CardContent className='space-y-6'>
            <div className='text-center space-y-2'>
              <h1 className='text-xl font-heading font-medium'>
                Authorize CLI
              </h1>
              <p className='text-sm text-muted-foreground'>
                The Groupi CLI is requesting access to your account. This will
                create an API key that expires in 90 days.
              </p>
            </div>

            <div className='bg-bg-sunken rounded-card p-4 space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <Icons.code className='size-4 text-muted-foreground' />
                <span className='font-medium'>Groupi CLI</span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Full access to your events, posts, friends, and settings.
              </p>
            </div>

            {error && (
              <div className='rounded-card bg-bg-error-subtle p-4 text-error border border-border-error'>
                <p className='text-sm'>{error}</p>
              </div>
            )}

            {generatedKey && !redirected ? (
              <div className='space-y-3'>
                <p className='text-sm text-warning font-medium'>
                  Could not connect to CLI. Copy this key manually:
                </p>
                <div className='flex gap-2'>
                  <code className='flex-1 bg-bg-sunken rounded-input px-3 py-2 text-xs font-mono break-all'>
                    {generatedKey}
                  </code>
                  <Button variant='outline' size='sm' onClick={handleCopy}>
                    {copied ? (
                      <Icons.check className='size-4' />
                    ) : (
                      <Icons.copy className='size-4' />
                    )}
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Run:{' '}
                  <code className='bg-bg-sunken px-1 rounded'>
                    groupi auth login --api-key {'<key>'} --url {'<url>'}
                  </code>
                </p>
              </div>
            ) : (
              <Button
                onClick={handleAuthorize}
                className='w-full'
                isLoading={authorizing}
                loadingText='Authorizing...'
              >
                Authorize CLI
              </Button>
            )}

            {!callbackPort && !generatedKey && (
              <p className='text-xs text-center text-muted-foreground'>
                No CLI callback detected. The key will be shown for manual copy.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
