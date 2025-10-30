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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function RepliesIcons({ replies }: { replies: MinimalReply[] }) {
  let authors: MinimalAuthor[] = [];
  replies
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
      {authors.map((author, i) => (
        <Avatar className='size-6' key={i}>
          <AvatarImage
            src={author.user?.image || ''}
            alt={author.user?.name || author.user?.email || 'User'}
          />
          <AvatarFallback>
            {author.user?.name?.slice(0, 2).toUpperCase() ||
              author.user?.email.slice(0, 2).toUpperCase() ||
              '??'}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
