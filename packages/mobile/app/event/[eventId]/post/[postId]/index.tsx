import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { PostDetailScreen } from '@/components/posts/post-detail-screen';
export default function Screen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  return <PostDetailScreen postId={postId as Id<'posts'>} />;
}
