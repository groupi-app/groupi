'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function GroupIdentityForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; description?: string; image?: string };
  submitLabel: string;
  onSubmit: (identity: {
    name: string;
    description: string;
    image: string;
  }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      className='space-y-4'
      onSubmit={async event => {
        event.preventDefault();
        setError('');
        setPending(true);
        try {
          await onSubmit({
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
          });
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to save Group. Please try again.'
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <div className='space-y-2'>
        <Label htmlFor='group-name'>Group name</Label>
        <Input
          id='group-name'
          required
          maxLength={100}
          value={name}
          onChange={event => setName(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='group-description'>Description (optional)</Label>
        <Textarea
          id='group-description'
          maxLength={2000}
          value={description}
          onChange={event => setDescription(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='group-image'>Image URL (optional)</Label>
        <Input
          id='group-image'
          type='url'
          pattern='https://.*'
          maxLength={2048}
          placeholder='https://'
          value={image}
          onChange={event => setImage(event.target.value)}
          disabled={pending}
        />
        <p className='text-sm text-muted-foreground'>
          Use an HTTPS image URL. Your identity appears on the unlisted Group
          page.
        </p>
      </div>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      <div className='flex gap-2'>
        <Button type='submit' disabled={pending || !name.trim()}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
