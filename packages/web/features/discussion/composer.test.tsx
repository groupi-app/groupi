import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { DiscussionComposer } from './composer';
const state = vi.hoisted(() => ({
  pendingUploads: [] as { id: string }[],
  save: vi.fn(),
  upload: vi.fn(),
  clear: vi.fn(),
  update: vi.fn(),
}));
vi.unmock('@/convex/_generated/api');
vi.mock('convex/react', () => ({ useMutation: () => state.update }));
vi.mock('next/dynamic', () => ({
  default: () =>
    function RichEditor(props: {
      content: string;
      onChange: (value: string) => void;
    }) {
      return (
        <textarea
          aria-label='Body'
          value={props.content}
          onChange={event => props.onChange(event.target.value)}
        />
      );
    },
}));
vi.mock('@/hooks/use-invite-list-navigation-guard', () => ({
  useInviteListNavigationGuard: () => undefined,
}));
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useAttachments: () => ({
    pendingUploads: state.pendingUploads,
    uploadAll: state.upload,
    clearAll: state.clear,
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    toggleSpoiler: vi.fn(),
    updateFile: vi.fn(),
    isUploading: false,
  }),
}));
vi.mock('@/components/attachments', () => ({
  AttachmentButton: () => <button type='button'>Add files</button>,
  AttachmentPreview: ({
    items,
    onRemove,
  }: {
    items: { id: string }[];
    onRemove: (id: string) => void;
  }) => (
    <>
      {items.map(item => (
        <button key={item.id} type='button' onClick={() => onRemove(item.id)}>
          Remove {item.id}
        </button>
      ))}
    </>
  ),
  fromPendingUpload: (item: { id: string }) => item,
  fromServerAttachment: (item: { _id: string }) => ({ id: item._id }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  state.pendingUploads = [{ id: 'new' }];
  state.upload.mockResolvedValue([
    {
      storageId: 'stored',
      filename: 'photo.png',
      size: 123,
      mimeType: 'image/png',
      isSpoiler: true,
      altText: 'A picnic',
      width: 20,
      height: 30,
      previewUrl: 'blob:private-preview',
    },
  ]);
});
it('commits rich text, uploaded metadata and existing attachment removals together', async () => {
  render(
    <DiscussionComposer
      initialTitle='Picnic'
      initialContent='<p>Bring a game</p>'
      existingAttachments={[
        {
          _id: 'existing',
          filename: 'old.png',
          type: 'IMAGE',
          mimeType: 'image/png',
          size: 1,
          url: null,
        },
      ]}
      submitLabel='Save post'
      onSave={state.save}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove existing' }));
  expect(state.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save post' }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith({
      title: 'Picnic',
      content: '<p>Bring a game</p>',
      attachmentIdsToDelete: ['existing' as Id<'attachments'>],
      attachments: [
        {
          storageId: 'stored',
          filename: 'photo.png',
          size: 123,
          mimeType: 'image/png',
          isSpoiler: true,
          altText: 'A picnic',
          width: 20,
          height: 30,
        },
      ],
    })
  );
  expect(state.clear).toHaveBeenCalled();
});
it('retains the draft and does not submit a post after a partial upload failure', async () => {
  state.upload.mockResolvedValue([]);
  render(
    <DiscussionComposer
      initialTitle='Picnic'
      initialContent='<p>Retained draft</p>'
      submitLabel='Save post'
      onSave={state.save}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save post' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'draft is preserved'
  );
  expect(state.save).not.toHaveBeenCalled();
  expect(state.clear).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Body')).toHaveValue('<p>Retained draft</p>');
});

it.each([false, true])(
  'permits attachment-only content for reply=%s',
  async reply => {
    render(
      <DiscussionComposer
        reply={reply}
        initialTitle='Attachment post'
        submitLabel='Submit attachment'
        onSave={state.save}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit attachment' }));
    await waitFor(() =>
      expect(state.save).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
          attachments: [expect.objectContaining({ storageId: 'stored' })],
        })
      )
    );
  }
);
it('prevents saving empty content after removing the final retained attachment', () => {
  state.pendingUploads = [];
  state.upload.mockResolvedValue([]);
  render(
    <DiscussionComposer
      initialTitle='Attachment post'
      existingAttachments={[
        {
          _id: 'last',
          filename: 'last.png',
          type: 'IMAGE',
          mimeType: 'image/png',
          size: 1,
          url: null,
        },
      ]}
      submitLabel='Save post'
      onSave={state.save}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove last' }));
  expect(screen.getByRole('button', { name: 'Save post' })).toBeDisabled();
  expect(state.save).not.toHaveBeenCalled();
});
