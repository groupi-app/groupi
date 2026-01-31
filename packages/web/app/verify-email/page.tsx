'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex';

interface VerificationResult {
  success: boolean;
  message?: string;
  email?: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  // Query verification status
  const verificationStatus = useQuery(
    api.emails.queries.getVerificationStatus,
    token ? { token } : 'skip'
  );

  // Mutation to verify email
  const verifyEmail = useMutation(api.emails.mutations.verifyEmail);

  // Auto-verify when component loads
  useEffect(() => {
    if (
      token &&
      verificationStatus?.status === 'valid' &&
      !verificationResult &&
      !isVerifying
    ) {
      handleVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleVerification is not memoized, adding it would cause infinite loops
  }, [token, verificationStatus, verificationResult, isVerifying]);

  const handleVerification = async () => {
    if (!token) return;

    setIsVerifying(true);
    try {
      const result = await verifyEmail({ token });
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // No token
  if (!token) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.mail className='h-5 w-5' />
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              No verification token provided. Please check your email for the
              verification link.
            </p>
            <Link href='/settings/account'>
              <Button variant='outline' className='w-full'>
                Go to Account Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading verification status
  if (verificationStatus === undefined) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.mail className='h-5 w-5' />
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (verificationStatus.status === 'invalid') {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.x className='h-5 w-5 text-destructive' />
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              This verification link is invalid. Please request a new
              verification email.
            </p>
            <Link href='/settings/account'>
              <Button variant='outline' className='w-full'>
                Go to Account Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired token
  if (verificationStatus.status === 'expired') {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.clock className='h-5 w-5 text-warning' />
              Link Expired
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              This verification link has expired for{' '}
              <span className='font-medium'>{verificationStatus.email}</span>.
            </p>
            <p className='text-muted-foreground'>
              Please go to your account settings and request a new verification
              email.
            </p>
            <Link href='/settings/account'>
              <Button variant='outline' className='w-full'>
                Go to Account Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification result
  if (verificationResult) {
    const isSuccess = verificationResult.success;

    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {isSuccess ? (
                <Icons.check className='h-5 w-5 text-success' />
              ) : (
                <Icons.x className='h-5 w-5 text-destructive' />
              )}
              {isSuccess ? 'Email Verified!' : 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {isSuccess ? (
              <>
                <p className='text-muted-foreground'>
                  <span className='font-medium'>
                    {verificationResult.email}
                  </span>{' '}
                  has been successfully added to your account.
                </p>
                <p className='text-muted-foreground'>
                  You can now use this email address for notifications.
                </p>
              </>
            ) : (
              <p className='text-muted-foreground'>
                {verificationResult.message}
              </p>
            )}

            <div className='space-y-2'>
              <Link href='/settings/account'>
                <Button className='w-full'>Go to Account Settings</Button>
              </Link>
              {isSuccess && (
                <Link href='/settings/notifications'>
                  <Button variant='outline' className='w-full'>
                    Configure Notifications
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifying state
  if (isVerifying) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.mail className='h-5 w-5' />
              Verifying Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <Icons.spinner className='h-8 w-8 animate-spin' />
              <p className='text-muted-foreground text-center'>
                Verifying{' '}
                <span className='font-medium'>{verificationStatus.email}</span>
                ...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Should not reach here, but handle anyway
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.mail className='h-5 w-5' />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            Ready to verify{' '}
            <span className='font-medium'>{verificationStatus.email}</span>
          </p>
          <Button onClick={handleVerification} className='w-full'>
            Verify Email Address
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.mail className='h-5 w-5' />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
