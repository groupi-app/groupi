import { ReplyListClient } from './reply-list-client';
import { getAllRepliesAction } from '@/actions/admin-actions';

type ReplyListServerProps = {
  searchParams?: {
    replyCursor?: string;
    replySearch?: string;
  };
};

export async function ReplyListServer({ searchParams }: ReplyListServerProps) {
  const cursor = searchParams?.replyCursor;
  const search = searchParams?.replySearch;

  const [error, data] = await getAllRepliesAction({
    cursor,
    limit: 50,
    search: search || undefined,
  });

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-destructive'>
          Error loading replies: {error.message}
        </p>
      </div>
    );
  }

  return (
    <ReplyListClient
      initialReplies={data?.items || []}
      initialTotalCount={data?.totalCount || 0}
      initialNextCursor={data?.nextCursor}
      currentCursor={cursor}
      currentSearch={search}
    />
  );
}
