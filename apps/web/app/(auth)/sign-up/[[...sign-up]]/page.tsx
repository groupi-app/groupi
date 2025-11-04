'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSocialSignIn = async (provider: 'discord' | 'google') => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn.social({
        provider,
        callbackURL: '/events',
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

  return (
    <div className='container py-24'>
      <div className='flex justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
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
                Continue with Discord
              </Button>
              <Button
                onClick={() => handleSocialSignIn('google')}
                className='w-full'
                variant='outline'
                disabled={loading}
              >
                Continue with Google
              </Button>
            </div>

            {error && <div className='text-red-500 text-sm'>{error}</div>}

            <div className='text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link href='/sign-in' className='underline'>
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
