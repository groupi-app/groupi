'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';
import { useGlobalUser } from '@/context/global-user-context';

const HomeContent = dynamic(() => import('./components/home-content'), {
  loading: () => (
    <div className='min-h-screen bg-muted flex items-center justify-center'>
      <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsOnboarding === false) {
      router.replace('/events');
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  if (isLoading || (isAuthenticated && needsOnboarding === false)) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return <HomeContent />;
}
