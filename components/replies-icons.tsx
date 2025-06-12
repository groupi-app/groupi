import { AuthorReply } from '@/types';
import { Person } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function RepliesIcons({ replies }: { replies: AuthorReply[] }) {
  let authors: Person[] = [];
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
          <AvatarImage src={author.imageUrl} alt={author.username} />
          <AvatarFallback>
            {author.firstName?.toString()[0] +
              '' +
              author.lastName?.toString()[0]}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
