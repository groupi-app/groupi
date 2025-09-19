import { useState } from 'react';
import { useCreatePost } from '@groupi/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function CreatePostForm({ eventId }: { eventId: string }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const createPost = useCreatePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createPost.mutate({
      title,
      content,
      eventId,
    });
  };

  const isFormValid = title.trim() && content.trim();

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Input
        placeholder='Post title'
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={createPost.isLoading}
      />

      <Textarea
        placeholder="What's happening with this event?"
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={createPost.isLoading}
        rows={4}
      />

      <Button
        type='submit'
        disabled={!isFormValid || createPost.isLoading}
        className='w-full'
      >
        {createPost.isLoading ? 'Creating...' : 'Create Post'}
      </Button>

      {/* Optional: Show error state */}
      {createPost.isError && (
        <p className='text-sm text-red-600'>
          Failed to create post. Please try again.
        </p>
      )}
    </form>
  );
}
