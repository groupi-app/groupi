'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useGlobalUser } from '@/context/global-user-context';
import {
  parseCliAuthRequest,
  cliAuthReturnPath,
  cliCallbackUrl,
  navigateToCli,
} from '@/lib/cli-auth';

export default function CliAuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner size='lg' />}>
      <CliAuthContent />
    </Suspense>
  );
}

function CliAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const request = parseCliAuthRequest(searchParams);
  const returnPath = request ? cliAuthReturnPath(request) : null;
  const { isAuthenticated, isLoading, needsOnboarding, user } = useGlobalUser();
  const authorize = useMutation(api.cliAuth.mutations.authorize);
  const [status, setStatus] = useState<
    'idle' | 'authorizing' | 'handoff' | 'cancelled'
  >('idle');
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    if (isLoading || !returnPath) return;
    if (!isAuthenticated)
      router.replace(`/sign-in?redirect=${encodeURIComponent(returnPath)}`);
    else if (needsOnboarding)
      router.replace(`/onboarding?redirect=${encodeURIComponent(returnPath)}`);
  }, [isLoading, isAuthenticated, needsOnboarding, returnPath, router]);

  async function handleAuthorize() {
    if (!request || !isAuthenticated || needsOnboarding || inFlight.current)
      return;
    inFlight.current = true;
    setStatus('authorizing');
    setError('');
    try {
      const result = await authorize(request);
      setStatus('handoff');
      navigateToCli(cliCallbackUrl(request, { code: result.code }));
    } catch {
      inFlight.current = false;
      setStatus('idle');
      setError(
        'Could not authorize the CLI. Try again, or restart sign-in in your terminal.'
      );
    }
  }

  function handleCancel() {
    if (!request || inFlight.current) return;
    inFlight.current = true;
    setStatus('cancelled');
    navigateToCli(cliCallbackUrl(request, { error: 'access_denied' }));
  }

  if (request && (isLoading || !isAuthenticated || needsOnboarding)) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const handingOff = status === 'handoff' || status === 'cancelled';
  return (
    <div className='container flex justify-center px-4 py-12 md:py-24'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>
            {!request
              ? 'Invalid CLI sign-in request'
              : handingOff
                ? 'Return to your terminal'
                : 'Authorize CLI'}
          </CardTitle>
          <CardDescription>
            {!request
              ? 'Start a new sign-in from the Groupi CLI. This link is incomplete or invalid.'
              : handingOff
                ? status === 'cancelled'
                  ? 'Authorization was cancelled. Your terminal will confirm the cancellation.'
                  : 'Your terminal is completing sign-in and saving your credential securely. Wait for its confirmation before closing this tab.'
                : 'Connect the Groupi CLI on this device to your account for 90 days.'}
          </CardDescription>
        </CardHeader>
        {request && !handingOff ? (
          <>
            <CardContent className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1 rounded-card bg-bg-sunken p-4'>
                <p className='text-sm text-muted-foreground'>Signed in as</p>
                <p className='font-medium break-words'>{user?.name}</p>
                <p className='text-sm break-all'>{user?.email}</p>
              </div>
              <p className='text-sm text-muted-foreground'>
                The CLI can access your events, posts, friends, and settings
                with your existing permissions. Only authorize if you started
                this sign-in in your terminal.
              </p>
              {error ? (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
            <CardFooter className='flex flex-col gap-3'>
              <Button
                onClick={handleAuthorize}
                disabled={status === 'authorizing'}
                className='w-full'
              >
                {status === 'authorizing' ? 'Authorizing…' : 'Authorize CLI'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={status === 'authorizing'}
                variant='outline'
                className='w-full'
              >
                Cancel
              </Button>
            </CardFooter>
          </>
        ) : null}
      </Card>
    </div>
  );
}
