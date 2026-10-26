'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPosts } from '@/features/group-posts';
export default function Page() {
  const { groupId } = useParams<{ groupId: string; postId: string }>();
  return <GroupPosts groupId={groupId as Id<'groups'>} />;
}
