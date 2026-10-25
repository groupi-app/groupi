'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { BlockNoteEditorProps } from './rich-text-editor';
import dynamic from 'next/dynamic';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { FunctionArgs } from 'convex/server';
import {
  discussionLengthAllowed,
  titleLengthAllowed,
  hasDiscussionText,
} from '@groupi/shared';
import { useAttachments } from '@/hooks/convex/use-file-upload';
import { useInviteListNavigationGuard } from '@/hooks/use-invite-list-navigation-guard';
import {
  AttachmentButton,
  AttachmentPreview,
  fromPendingUpload,
  fromServerAttachment,
  type ServerAttachment,
} from '@/components/attachments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const RichTextEditor = dynamic(
  () => import('./rich-text-editor').then(module => module.BlockNoteEditor),
  { ssr: false }
);
export type MentionMember = {
  personId: Id<'persons'>;
  name: string;
  username?: string;
  image?: string;
};
export type ComposerValues = Pick<
  FunctionArgs<typeof api.posts.mutations.createPost>,
  'title' | 'content' | 'attachments'
> & { attachmentIdsToDelete: Id<'attachments'>[] };

/** Parent-independent editor. Uploads and previews use the same attachment pipeline as Event posts. */
export function DiscussionComposer({
  initialTitle = '',
  initialContent = '',
  existingAttachments = [],
  mentionMembers,
  eventMembers,
  reply = false,
  submitLabel,
  cancelLabel = 'Cancel',
  onSave,
  onCancel,
  onContentChange,
  onDraftChange,
  children,
}: {
  initialTitle?: string;
  initialContent?: string;
  existingAttachments?: ServerAttachment[];
  mentionMembers?: MentionMember[];
  eventMembers?: BlockNoteEditorProps['members'];
  reply?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onSave: (values: ComposerValues) => Promise<unknown>;
  onCancel?: () => void;
  onContentChange?: (content: string) => void;
  onDraftChange?: (dirty: boolean) => void;
  children?: ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [deleted, setDeleted] = useState<Id<'attachments'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [error, setError] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const uploads = useAttachments();
  const updateAttachment = useMutation(
    api.attachments.mutations.updateAttachment
  );
  const dirty =
    !saved &&
    (title !== initialTitle ||
      content !== initialContent ||
      deleted.length > 0 ||
      uploads.pendingUploads.length > 0);
  useEffect(() => {
    onDraftChange?.(dirty);
    return () => onDraftChange?.(false);
  }, [dirty, onDraftChange]);
  const historyWarning = useInviteListNavigationGuard(dirty, callback =>
    setLeave(() => callback)
  );
  const attachments = existingAttachments.filter(
    item => !deleted.includes(item._id as Id<'attachments'>)
  );
  const valid =
    (reply ||
      (title.trim().length > 0 && titleLengthAllowed(title, initialTitle))) &&
    (hasDiscussionText(content) ||
      attachments.length > 0 ||
      uploads.pendingUploads.length > 0) &&
    discussionLengthAllowed(content, reply ? 5000 : 3000, initialContent);
  async function submit() {
    if (saving || uploads.isUploading || !valid) return;
    setSaving(true);
    setError('');
    try {
      const uploaded = await uploads.uploadAll();
      if (uploaded.length !== uploads.pendingUploads.length)
        throw new Error(
          'Some attachments could not be uploaded. Your draft is preserved.'
        );
      await onSave({
        title: title.trim(),
        content,
        attachments: uploaded.map(
          ({
            storageId,
            filename,
            size,
            mimeType,
            width,
            height,
            isSpoiler,
            altText,
          }) => ({
            storageId,
            filename,
            size,
            mimeType,
            width,
            height,
            isSpoiler,
            altText,
          })
        ),
        attachmentIdsToDelete: deleted,
      });
      setSaved(true);
      uploads.clearAll();
      if (reply) {
        setContent('');
        setDeleted([]);
        setEditorVersion(value => value + 1);
        onContentChange?.('');
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save. Your draft is preserved.'
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <form
        className='space-y-4'
        onSubmit={event => {
          event.preventDefault();
          void submit();
        }}
      >
        {!reply && (
          <div className='space-y-2'>
            <Label htmlFor='discussion-title'>Title</Label>
            <Input
              data-test='post-editor-title'
              id='discussion-title'
              value={title}
              disabled={saving}
              onChange={event => {
                setSaved(false);
                setTitle(event.target.value);
              }}
              required
            />
          </div>
        )}
        <div
          role='group'
          aria-label={reply ? 'Reply' : 'Post'}
          className='space-y-2'
        >
          <p className='text-sm font-medium'>{reply ? 'Reply' : 'Post'}</p>
          <RichTextEditor
            data-test='post-editor-body'
            key={editorVersion}
            content={content}
            onChange={value => {
              setSaved(false);
              setContent(value);
              onContentChange?.(value);
            }}
            mentionMembers={mentionMembers}
            members={eventMembers}
            maxLength={reply ? 5000 : 3000}
            disabled={saving}
            onSubmit={() => void submit()}
          />
        </div>
        <AttachmentButton
          onFilesSelected={async files => {
            const remaining = Math.max(
              0,
              10 - attachments.length - uploads.pendingUploads.length
            );
            if (files.length > remaining)
              setError(`You can add ${remaining} more attachments.`);
            const result = await uploads.addFiles(files.slice(0, remaining));
            if (result.errors.length) setError(result.errors.join(' '));
          }}
          disabled={
            saving ||
            uploads.isUploading ||
            attachments.length + uploads.pendingUploads.length >= 10
          }
          remainingSlots={Math.max(
            0,
            10 - attachments.length - uploads.pendingUploads.length
          )}
          label='Add images, videos, or files'
        />
        {!!attachments.length && (
          <AttachmentPreview
            items={attachments.map(fromServerAttachment)}
            onRemove={id => {
              setSaved(false);
              setDeleted(previous => [...previous, id as Id<'attachments'>]);
            }}
            onToggleSpoiler={id => {
              const item = attachments.find(
                attachment => attachment._id === id
              );
              if (item)
                void updateAttachment({
                  attachmentId: id as Id<'attachments'>,
                  isSpoiler: !item.isSpoiler,
                }).catch(cause => setError(String(cause)));
            }}
            onUpdate={(id, updates) => {
              void updateAttachment({
                attachmentId: id as Id<'attachments'>,
                filename: updates.displayFilename,
                altText: updates.altText,
                isSpoiler: updates.isSpoiler,
              }).catch(cause => setError(String(cause)));
            }}
          />
        )}
        {!!uploads.pendingUploads.length && (
          <AttachmentPreview
            items={uploads.pendingUploads.map(fromPendingUpload)}
            onRemove={uploads.removeFile}
            onToggleSpoiler={uploads.toggleSpoiler}
            onUpdate={uploads.updateFile}
          />
        )}
        {!valid && dirty && (
          <p role='status' className='text-sm text-muted-foreground'>
            Add {reply ? 'a reply' : 'a title and post text'} within the{' '}
            {reply ? '5,000' : '3,000'} character body limit.
          </p>
        )}
        {children}
        <div className='flex flex-wrap gap-2'>
          <Button
            data-test='post-editor-submit'
            disabled={saving || uploads.isUploading || !valid}
            type='submit'
          >
            {saving ? 'Saving…' : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => (dirty ? setLeave(() => onCancel) : onCancel())}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
        {error && <p role='alert'>{error}</p>}
        {historyWarning && <p role='alert'>{historyWarning}</p>}
      </form>
      <Dialog
        open={leave !== null}
        onOpenChange={open => {
          if (!open) setLeave(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Discard this draft and leave? Pending text and attachment changes
              will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setLeave(null)}>
              Keep editing
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                setSaved(true);
                uploads.clearAll();
                const callback = leave;
                setLeave(null);
                callback?.();
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
