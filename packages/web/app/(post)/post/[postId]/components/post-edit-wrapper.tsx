'use client';

import { Editor } from './editor';
import { usePostDetail, useCurrentUser } from '@/hooks/convex';
import { PostEditorSkeleton } from '@/components/skeletons';
import { Id } from '@/convex/_generated/dataModel';

export function PostEditWrapper({ postId }: { postId: string }) {
  const postData = usePostDetail(postId as Id<'posts'>);
  const currentUser = useCurrentUser();

  // Loading state
  if (!postData || !currentUser) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  // Handle case where post not found
  if (!postData.post) {
    return <div>Post not found</div>;
  }

  // Handle case where user is not a member (should be handled by auth guard)
  if (!postData.userMembership) {
    return <div>You are not a member of this event</div>;
  }

  const { post } = postData;
  const { title, content, _id: id, author, event } = post;

  if (!author || author.user?._id !== currentUser.user.id) {
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>You do not have permission to edit this post.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container pt-6'>
      <Editor eventId={event._id} postData={{ title, content, id }} />
    </div>
  );
}
