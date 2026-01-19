'use client';

import { NewPostWrapper } from './components/new-post-wrapper';
import { use } from 'react';

/**
 * Event New Post Page - Client-only architecture
 * - Authentication handled at (event) layout level
 * - Event membership check handled at [eventId] layout level
 * - Real-time post creation with Convex mutations
 */
export default function EventNewPostPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);

  return <NewPostWrapper eventId={eventId} />;
}
