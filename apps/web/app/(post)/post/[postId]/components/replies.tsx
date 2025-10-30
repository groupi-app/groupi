'use client';

import { useSession } from '@/lib/auth-client';
import ReplyFeed from './reply-feed';
import ReplyForm from './reply-form';

export function Replies({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return (
    <div className='flex flex-col my-12'>
      <h1 className='text-2xl font-heading font-medium mb-4'>Replies</h1>
      <div className='flex flex-col gap-4'>
        {userId && <ReplyForm postId={postId} userId={userId} />}
        <ReplyFeed postId={postId} />
      </div>
    </div>
  );
}
