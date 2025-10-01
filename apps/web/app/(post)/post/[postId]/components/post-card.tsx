import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getFullName } from '@/lib/utils';
import { Member } from '@/types';
import Link from 'next/link';
import { DeletePostDialog } from './deletePostDialog';
import { Icons } from '@/components/icons';
import MemberIcon from '@/app/(event)/event/[eventId]/components/member-icon';
import { PostCardContent } from './post-card-content';
import RepliesIcons from './replies-icons';

type MinimalAuthor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
};

type MinimalReply = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  author: MinimalAuthor;
};

type MinimalPostForCard = {
  id: string;
  title: string;
  content: string;
  author: MinimalAuthor;
  createdAt: Date;
  editedAt: Date | null;
  replies: MinimalReply[];
  authorId: string;
  event: { memberships: Member[] };
};

interface PostCardProps {
  postData: MinimalPostForCard;
  eventDateTime: Date | null;
}

export function PostCard({ postData, eventDateTime }: PostCardProps) {
  const {
    id,
    title,
    content,
    author,
    createdAt,
    editedAt,
    replies,
    authorId,
    event,
  } = postData;
  if (!author) return null;
  const fullName = getFullName(author.firstName, author.lastName);

  // TODO: Get userId and userRole from auth
  const userId = 'temp-user-id';
  const userRole = 'ATTENDEE';
  const members = event.memberships;
  const member = members.find((m: Member) => m.personId === authorId);

  const canDelete =
    userId === authorId ||
    member?.role === 'MODERATOR' ||
    member?.role === 'ORGANIZER';

  return (
    <Dialog>
      <DropdownMenu>
        <div className='rounded-xl border border-border w-full relative shadow-md z-10'>
          <div className='absolute top-4 left-3'>
            {member ? (
              <MemberIcon
                itemKey={member.id}
                member={member}
                userId={userId}
                userRole={userRole}
                eventDateTime={eventDateTime}
                className='border-transparent'
                align='start'
              />
            ) : (
              <div className='rounded-full size-10 bg-primary' />
            )}
          </div>
          <Link
            data-test='post-card'
            href={`/post/${id}`}
            className='w-full z-10'
          >
            <div className='w-full rounded-xl bg-card hover:bg-accent transition-colors group pt-4 px-5 pb-2'>
              <div className='flex flex-col gap-1'>
                <div className='ml-12 mb-2 flex flex-col -space-y-1 w-full pr-16'>
                  <span className='sm:text-xl font-heading text-card-foreground truncate overflow-hidden w-full'>
                    {title}
                  </span>
                  {fullName != '' ? (
                    <span className='text-sm text-muted-foreground'>
                      {fullName}
                    </span>
                  ) : (
                    <span className='text-sm text-muted-foreground'>
                      {author.username}
                    </span>
                  )}
                </div>
                <PostCardContent content={content} />
                <div className='flex items-center justify-between mt-2'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:gap-4'>
                    <span className='text-muted-foreground text-sm'>
                      Created {formatDate(createdAt)}
                    </span>
                    {editedAt &&
                      editedAt.toISOString() !== createdAt.toISOString() && (
                        <span className='text-muted-foreground text-sm'>
                          Edited {formatDate(editedAt)}
                        </span>
                      )}
                  </div>
                  <div className='text-muted-foreground flex items-center gap-1'>
                    <RepliesIcons replies={replies} />
                    <span className='text-sm'>{replies.length} replies</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          {canDelete && (
            <>
              <DropdownMenuTrigger className='absolute z-20 size-8 hover:bg-accent transition-all rounded-md top-2 right-2 flex items-center justify-center'>
                <Icons.more />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {userId === authorId && (
                  <DropdownMenuItem className='cursor-pointer' asChild>
                    <Link href={`/post/${id}/edit`}>
                      <div className='flex items-center gap-1'>
                        <Icons.edit className='size-4' />
                        <span>Edit</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  asChild
                  className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                >
                  <DialogTrigger asChild>
                    <div className='flex items-center gap-1'>
                      <Icons.delete className='size-4' />
                      <span>Delete</span>
                    </div>
                  </DialogTrigger>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </>
          )}
        </div>
      </DropdownMenu>
      <DeletePostDialog id={id} />
    </Dialog>
  );
}

PostCard.Skeleton = function PostCardSkeleton() {
  return (
    <div className='rounded-xl border border-border w-full relative shadow-md max-w-4xl'>
      <div className='w-full transition-all pt-4 px-5 pb-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Skeleton className='size-10 rounded-full' />
            <div className='flex flex-col space-y-1'>
              <Skeleton className='w-36 h-4' />
              <Skeleton className='w-16 h-3' />
            </div>
          </div>
          <div className='flex flex-wrap gap-1'>
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-3/4 h-4' />
          </div>
          <div className='flex items-center justify-between mt-2'>
            <Skeleton className='w-16 h-4' />
            <Skeleton className='w-16 h-4' />
          </div>
        </div>
      </div>
    </div>
  );
};
