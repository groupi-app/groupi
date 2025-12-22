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
  createdAt: Date;
  author: MinimalAuthor;
};

export default function RepliesIcons({ replies }: { replies: MinimalReply[] }) {
  let authors: MinimalAuthor[] = [];
  replies
    .sort((a, b) => {
      const aDate =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const bDate =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return bDate.getTime() - aDate.getTime();
    })
    .map(reply => {
      if (
        reply.author &&
        !authors.some(author => author.id === reply.author.id)
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
