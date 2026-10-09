'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
export default function ListError({ reset }: { reset: () => void }) {
  const { groupId, toolId } = useParams<{ groupId: string; toolId?: string }>();
  return (
    <main className='p-6 space-y-4'>
      <p role='alert'>
        This list is unavailable under your current Group access or owner
        policy.
      </p>
      <Button onClick={reset}>Check current access</Button>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/lists`}
      >
        Lists and owner policy
      </Link>
      {toolId && (
        <Link
          className='text-primary underline'
          href={`/groups/${groupId}/lists/${toolId}/own`}
        >
          My saved answer history
        </Link>
      )}
    </main>
  );
}
