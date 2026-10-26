'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { Lock, Unlock, Pin, PinOff } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useSetPostRepliesDisabled,
  useSetPostPinned,
} from '@/hooks/convex/use-post-controls';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
export type PostState = {
  _id: Id<'posts'>;
  repliesDisabled?: boolean;
  repliesRevision?: number;
  pinnedAt?: number;
  pinRevision?: number;
  canSetRepliesDisabled?: boolean;
  canPin?: boolean;
};
export function usePostStateActions(post: PostState, onComplete?: () => void) {
  const setReplies = useSetPostRepliesDisabled();
  const setPinned = useSetPostPinned();
  const latestPostId = useRef(post._id);
  useLayoutEffect(() => {
    latestPostId.current = post._id;
  }, [post._id]);
  const [repliesAck, setRepliesAck] = useState<{
    postId: Id<'posts'>;
    revision: number;
    disabled: boolean;
  } | null>(null);
  const [pinAck, setPinAck] = useState<{
    postId: Id<'posts'>;
    revision: number;
    pinned: boolean;
  } | null>(null);
  const replies =
    repliesAck?.postId === post._id &&
    (post.repliesRevision ?? 0) < repliesAck.revision
      ? repliesAck
      : {
          revision: post.repliesRevision ?? 0,
          disabled: Boolean(post.repliesDisabled),
        };
  const pin =
    pinAck?.postId === post._id && (post.pinRevision ?? 0) < pinAck.revision
      ? pinAck
      : {
          revision: post.pinRevision ?? 0,
          pinned: post.pinnedAt !== undefined,
        };
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{
    postId: Id<'posts'>;
    message: string;
  } | null>(null);
  const error = failure?.postId === post._id ? failure.message : '';
  const perform = async (kind: 'replies' | 'pin') => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const postId = post._id;
    setFailure(null);
    try {
      if (kind === 'replies') {
        const result = await setReplies({
          postId: post._id,
          repliesDisabled: !replies.disabled,
          expectedRevision: replies.revision,
        });
        if (latestPostId.current !== postId) return;
        setRepliesAck({
          postId,
          revision: result.revision,
          disabled: result.repliesDisabled,
        });
      } else {
        const result = await setPinned({
          postId: post._id,
          pinned: !pin.pinned,
          expectedRevision: pin.revision,
        });
        if (latestPostId.current !== postId) return;
        setPinAck({ postId, revision: result.revision, pinned: result.pinned });
      }
      if (latestPostId.current === postId) onComplete?.();
    } catch (cause) {
      if (latestPostId.current === postId)
        setFailure({
          postId,
          message:
            cause instanceof Error
              ? cause.message
              : 'Unable to update this post. Try again.',
        });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return {
    busy,
    error,
    actions: [
      ...(post.canSetRepliesDisabled
        ? [
            {
              key: 'replies',
              label: replies.disabled ? 'Open replies' : 'Lock replies',
              Icon: replies.disabled ? Unlock : Lock,
              onSelect: () => void perform('replies'),
            },
          ]
        : []),
      ...(post.canPin
        ? [
            {
              key: 'pin',
              label: pin.pinned ? 'Unpin post' : 'Pin post',
              Icon: pin.pinned ? PinOff : Pin,
              onSelect: () => void perform('pin'),
            },
          ]
        : []),
    ],
  };
}
export function PostStateMenuItems({
  state,
  menu,
}: {
  state: ReturnType<typeof usePostStateActions>;
  menu: 'drawer' | 'dropdown' | 'context';
}) {
  return (
    <>
      {state.actions.map(action =>
        menu === 'drawer' ? (
          <Button
            key={action.key}
            variant='ghost'
            disabled={state.busy}
            className='min-h-11 w-full justify-start'
            onClick={action.onSelect}
          >
            <action.Icon aria-hidden className='size-4 shrink-0' />
            {action.label}
          </Button>
        ) : menu === 'context' ? (
          <ContextMenuItem
            key={action.key}
            disabled={state.busy}
            onSelect={event => {
              event.preventDefault();
              action.onSelect();
            }}
          >
            <action.Icon aria-hidden className='mr-2 size-4 shrink-0' />
            {action.label}
          </ContextMenuItem>
        ) : (
          <DropdownMenuItem
            key={action.key}
            disabled={state.busy}
            onSelect={event => {
              event.preventDefault();
              action.onSelect();
            }}
          >
            <action.Icon aria-hidden className='mr-2 size-4 shrink-0' />
            {action.label}
          </DropdownMenuItem>
        )
      )}
      {menu !== 'dropdown' && state.error && (
        <p role='alert' className='px-3 py-2 text-sm text-error'>
          {state.error}
        </p>
      )}
    </>
  );
}
