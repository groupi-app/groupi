import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';

type MinimalAuthor = {
  id: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

type MinimalReply = {
  createdAt?: Date | number;
  _creationTime?: number;
  author?: MinimalAuthor | null;
};

export default function RepliesIcons({ replies }: { replies: MinimalReply[] }) {
  let authors: MinimalAuthor[] = [];

  // Helper to get timestamp from reply
  const getTimestamp = (reply: MinimalReply): number => {
    if (reply.createdAt instanceof Date) return reply.createdAt.getTime();
    if (typeof reply.createdAt === 'number') return reply.createdAt;
    if (typeof reply._creationTime === 'number') return reply._creationTime;
    return 0;
  };

  replies
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))
    .forEach(reply => {
      if (
        reply.author &&
        !authors.some(author => author.id === reply.author?.id)
      ) {
        authors.push(reply.author);
      }
    });
  authors = authors.slice(0, 3);

  return (
    <div className='flex items-center'>
      {authors.map(author => (
        <Avatar className='size-6' key={author.id}>
          <AvatarImage
            src={author.user?.image || ''}
            alt={author.user?.name || author.user?.email || 'User'}
          />
          <AvatarFallback>
            {getInitialsFromName(author.user?.name, author.user?.email)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
