'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
export default function PostError({ reset }: { reset: () => void }) {
  const { groupId } = useParams<{ groupId: string }>();
  return (
    <main className='space-y-4 p-6'>
      <p role='alert'>
        This post is unavailable under your current Group access. Current
        membership and completed required onboarding are needed.
      </p>
      <Button onClick={reset}>Check current access</Button>
      <Link className='text-primary underline' href={`/groups/${groupId}`}>
        Back to Group
      </Link>
    </main>
  );
}
