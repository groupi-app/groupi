import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { EditPostScreen } from '@/components/posts/edit-post-screen';
export default function Screen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  return <EditPostScreen postId={postId as Id<'posts'>} />;
}
