import { NewPostContent } from './components/new-post-content';

export default async function EventNewPostPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <NewPostContent eventId={eventId} />;
}
