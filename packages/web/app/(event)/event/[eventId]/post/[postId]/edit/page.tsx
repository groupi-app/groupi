'use client';

import { PostEditWrapper } from '../components/post-edit-wrapper';

/**
 * Post Edit Page - Client-only architecture
 * - Authentication handled at layout level
 * - Content component handles loading state via context
 * - Real-time post editing with Convex mutations
 */
export default function PostEditPage() {
  return <PostEditWrapper />;
}
