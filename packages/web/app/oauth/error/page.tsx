'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HostedError } from '@/features/authorization/hosted-error';
function HostedErrorContent() {
  const params = useSearchParams();
  return (
    <main className='mx-auto w-full max-w-2xl px-4 py-8'>
      <HostedError interactionId={params.get('interactionId') ?? ''} />
    </main>
  );
}

export default function HostedErrorPage() {
  return (
    <Suspense>
      <HostedErrorContent />
    </Suspense>
  );
}
