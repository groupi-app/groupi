'use client';
import { useSearchParams } from 'next/navigation';
import { DelegatedConsent } from '@/features/authorization';
export default function ConsentPage() {
  const params = useSearchParams();
  const interactionId = params.get('interactionId') ?? '';
  return (
    <main className='mx-auto w-full max-w-2xl px-4 py-8'>
      <DelegatedConsent key={interactionId} interactionId={interactionId} />
    </main>
  );
}
