'use client';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useCreatePost, useUpdatePost } from '@/hooks/convex/use-posts';
import { useEventMembers } from '@/hooks/convex/use-events';
import type { ServerAttachment } from '@/components/attachments';
import { DiscussionComposer } from '@/features/discussion/composer';

/** Event ownership adapter for the same composer mounted by Group post routes. */
export function Editor({
  eventId,
  postData,
  existingAttachments = [],
}: {
  eventId: string;
  postData?: { title: string; content: string; id: string };
  existingAttachments?: ServerAttachment[];
}) {
  const router = useRouter();
  const create = useCreatePost();
  const update = useUpdatePost(eventId as Id<'events'>);
  const attendees = useEventMembers(eventId as Id<'events'>);
  const backUrl = postData
    ? `/event/${eventId}/post/${postData.id}`
    : `/event/${eventId}`;
  return (
    <DiscussionComposer
      initialTitle={postData?.title}
      initialContent={postData?.content}
      existingAttachments={existingAttachments}
      eventMembers={attendees?.event?.memberships}
      submitLabel={postData ? 'Update Post' : 'Post'}
      cancelLabel='Back'
      onCancel={() => router.push(backUrl)}
      onSave={async ({
        title,
        content,
        attachments,
        attachmentIdsToDelete,
      }) => {
        if (postData) {
          await update({
            postId: postData.id as Id<'posts'>,
            title,
            content,
            attachmentsToAdd: attachments,
            attachmentIdsToDelete,
          });
          router.push(`/event/${eventId}/post/${postData.id}`);
        } else {
          await create({
            eventId: eventId as Id<'events'>,
            title,
            content,
            attachments,
          });
          router.push(`/event/${eventId}`);
        }
      }}
    />
  );
}
