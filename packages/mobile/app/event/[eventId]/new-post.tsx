import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { NewPostScreen } from '@/components/posts/new-post-screen';
export default function Screen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <NewPostScreen eventId={eventId as Id<'events'>} />;
}
