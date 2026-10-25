'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
export default function ListError({ reset }: { reset: () => void }) {
  const { eventId, toolId } = useParams<{ eventId: string; toolId?: string }>();
  return (
    <main className='p-6 space-y-4'>
      <p role='alert'>
        This list is unavailable under your current Event access or content
        policy.
      </p>
      <Button onClick={reset}>Check current access</Button>
      <Link className='text-primary underline' href={`/event/${eventId}/lists`}>
        Event lists
      </Link>
      {toolId && (
        <Link
          className='text-primary underline'
          href={`/event/${eventId}/lists/${toolId}/own`}
        >
          My saved answer history
        </Link>
      )}
    </main>
  );
}
