'use client';
import { useId, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export function HostedAppearanceEditor({
  appId,
  appearance,
}: {
  appId: Id<'delegatedApps'>;
  appearance?: { brandName: string; senderName: string; accent: string };
}) {
  const id = useId();
  const configure = useMutation(api.delegatedApps.hosted.configureAppearance);
  const [brandName, setBrandName] = useState(appearance?.brandName ?? '');
  const [senderName, setSenderName] = useState(appearance?.senderName ?? '');
  const [accent, setAccent] = useState(appearance?.accent ?? '#2563eb');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className='space-y-3'
      onSubmit={async event => {
        event.preventDefault();
        setPending(true);
        setNotice('');
        setError('');
        try {
          await configure({
            appId,
            appearance: { brandName, senderName, accent },
          });
          setNotice('Hosted appearance saved.');
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not save hosted appearance'
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} className='space-y-3'>
        <legend className='font-medium'>Hosted sign-in appearance</legend>
        <p className='text-sm text-muted-foreground'>
          Applies to this registered app’s sign-in, onboarding, consent and
          email. The provider and Developer app remain disclosed. Email uses the
          configured provider mailbox; callback destinations remain the exact
          registered URIs.
        </p>
        <div>
          <Label htmlFor={`${id}-brand`}>Hosted brand name</Label>
          <Input
            id={`${id}-brand`}
            value={brandName}
            onChange={event => setBrandName(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${id}-sender`}>Email sender name</Label>
          <Input
            id={`${id}-sender`}
            value={senderName}
            onChange={event => setSenderName(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${id}-accent`}>Brand accent</Label>
          <Input
            id={`${id}-accent`}
            value={accent}
            onChange={event => setAccent(event.target.value)}
            pattern='#[0-9a-fA-F]{6}'
            required
          />
        </div>
        <Button type='submit' isLoading={pending}>
          Save hosted appearance
        </Button>
      </fieldset>
      {notice ? <p role='status'>{notice}</p> : null}
      {error ? <p role='alert'>{error}</p> : null}
    </form>
  );
}
