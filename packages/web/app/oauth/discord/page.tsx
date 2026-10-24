'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiscordConnect } from '@/features/authorization';
function Content() {
  const params = useSearchParams();
  const state = params.get('state') ?? '';
  return (
    <main className='mx-auto w-full max-w-2xl px-4 py-8'>
      <DiscordConnect key={state} state={state} />
    </main>
  );
}
export default function DiscordPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
