'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DelegatedConsent } from '@/features/authorization';
function ConsentContent() {
  const params = useSearchParams();
  const interactionId = params.get('interactionId') ?? '';
  return (
    <main className='mx-auto w-full max-w-2xl px-4 py-8'>
      <DelegatedConsent key={interactionId} interactionId={interactionId} />
    </main>
  );
}

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentContent />
    </Suspense>
  );
}
