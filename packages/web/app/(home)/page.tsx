'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeHeader } from './components/home-header';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useGlobalUser } from '@/context/global-user-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();

  useEffect(() => {
    // Redirect authenticated users who don't need onboarding to events
    if (!isLoading && isAuthenticated && needsOnboarding === false) {
      router.replace('/events');
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  // Show nothing while checking auth or if user will be redirected
  if (isLoading || (isAuthenticated && needsOnboarding === false)) {
    return (
      <div className='container max-w-3xl py-8 flex items-center justify-center min-h-[50vh]'>
        <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Show marketing page for unauthenticated users or those needing onboarding
  return (
    <div className='container max-w-3xl py-8 flex flex-col gap-8'>
      <div className=''>
        <HomeHeader />
      </div>
      <div className='flex flex-col gap-2'>
        <p className='text-muted-foreground'>
          Welcome to Groupi! The app designed to take the frustration out of
          making plans.
        </p>
        <p>
          Groupi is currently under active development and will continue to grow
          and change over time. If you have any feedback, please contact{' '}
          {
            <Link className='underline font-medium' href='https://tsurette.com'>
              Theia
            </Link>
          }{' '}
          and let her know!
        </p>
        <p>Otherwise, I hope you enjoy!</p>
      </div>
      <Link href='/create' className='w-max'>
        <Button className='flex items-center gap-1'>
          <Icons.arrowRight className='size-4' />
          <span>Get Started!</span>
        </Button>
      </Link>
      <div className='text-sm text-muted-foreground'>
        <Link href='/changelog' className='underline hover:text-foreground'>
          View Changelog
        </Link>
      </div>
    </div>
  );
}
