import { PostListClient } from './post-list-client';
import { getAllPostsAction } from '@/actions/admin-actions';

type PostListServerProps = {
  searchParams?: {
    postCursor?: string;
    postSearch?: string;
  };
};

export async function PostListServer({ searchParams }: PostListServerProps) {
  const cursor = searchParams?.postCursor;
  const search = searchParams?.postSearch;

  const [error, data] = await getAllPostsAction({
    cursor,
    limit: 50,
    search: search || undefined,
  });

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-destructive'>Error loading posts: {error.message}</p>
      </div>
    );
  }

  return (
    <PostListClient
      initialPosts={data?.items || []}
      initialTotalCount={data?.totalCount || 0}
      initialNextCursor={data?.nextCursor}
      currentCursor={cursor}
      currentSearch={search}
    />
  );
}
