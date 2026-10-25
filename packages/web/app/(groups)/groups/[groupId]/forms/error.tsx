'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
export default function FormError({ reset }: { reset: () => void }) {
  const { groupId, toolId } = useParams<{ groupId: string; toolId?: string }>();
  return (
    <main className='p-6 space-y-4'>
      <p role='alert'>
        This form is unavailable under your current Group access or owner
        policy.
      </p>
      <Button onClick={reset}>Check current access</Button>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/forms`}
      >
        Forms and owner policy
      </Link>
      {toolId && (
        <Link
          className='text-primary underline'
          href={`/groups/${groupId}/forms/${toolId}/history`}
        >
          My saved answer history
        </Link>
      )}
    </main>
  );
}
