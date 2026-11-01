import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createRoot } from 'react-dom/client';
import {
  GroupPostDetail,
  GroupPostEditor,
  GroupPosts,
} from '@/features/group-posts/group-posts';
import { FullPost } from '@/app/(event)/event/[eventId]/post/[postId]/components/full-post';
import { PostFeed } from '@/app/(event)/event/[eventId]/components/post-feed';
import { PostCard } from '@/components/post-card';
import { eventPost, useFixturePost } from './boundaries';
const params = new URLSearchParams(location.search);
function Event() {
  useFixturePost();
  const post = eventPost();
  return (
    <main className='mx-auto max-w-3xl p-4'>
      {params.has('feed') ? (
        <PostFeed
          data={
            {
              event: {
                ...post.event,
                posts: [
                  post,
                  { ...post, _id: 'pinned-1', title: 'Pinned announcement 1' },
                ],
              },
              userMembership: { personId: 'viewer', role: 'ORGANIZER' },
            } as never
          }
        />
      ) : params.has('card') ? (
        <PostCard
          postData={post as never}
          eventDateTime={null}
          userId='viewer'
          userRole='ORGANIZER'
        />
      ) : (
        <FullPost
          data={
            {
              post,
              userMembership: { personId: 'viewer', role: 'ORGANIZER' },
            } as never
          }
        />
      )}
    </main>
  );
}
const editor = new URLSearchParams(location.search).has('editor');
createRoot(document.getElementById('root')!).render(
  <TooltipProvider>
    {params.has('event') ? (
      <Event />
    ) : params.has('feed') ? (
      <div className='mx-auto max-w-3xl p-4'>
        <GroupPosts groupId={'group-one' as never} />
      </div>
    ) : editor ? (
      <GroupPostEditor groupId={'group-one' as never} />
    ) : (
      <GroupPostDetail
        groupId={'group-one' as never}
        postId={'post-one' as never}
      />
    )}
  </TooltipProvider>
);
