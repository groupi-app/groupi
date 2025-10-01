type MinimalAuthor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
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
