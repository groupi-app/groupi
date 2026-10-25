'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPostEditor } from '@/features/group-posts';
export default function Page() {
  const { groupId, postId } = useParams<{ groupId: string; postId: string }>();
  return (
    <GroupPostEditor
      groupId={groupId as Id<'groups'>}
      postId={postId as Id<'groupPosts'>}
    />
  );
}
