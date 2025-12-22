import { SettingsNav } from './components/settings-nav';
import { ReactNode, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
      <SettingsNav />
      <Suspense fallback={<SettingsLayoutSkeleton />}>
        <DynamicSettingsContent>{children}</DynamicSettingsContent>
      </Suspense>
    </div>
  );
}

async function DynamicSettingsContent({ children }: { children: ReactNode }) {
  // Only wrap notifications page with SettingsFormProvider
  // Account page handles its own form provider

  // Check if we're on the notifications route by checking if we need settings data
  // We'll use a client component wrapper to detect the route
  // For now, we'll wrap all children but account page handles its own provider
  return <>{children}</>;
}

function SettingsLayoutSkeleton() {
  return (
    <div className='relative'>
      <div className='space-y-6 max-w-2xl p-6'>
        {/* Multiple form sections */}
        <div className='space-y-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>

        <div className='space-y-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>

        <div className='space-y-4'>
          <Skeleton className='h-6 w-48' />
          <div className='space-y-2'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-4 pt-4'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
    </div>
  );
}
