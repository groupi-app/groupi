import { render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { Editor } from '@/app/(event)/event/[eventId]/post/[postId]/components/editor';
import type { ComposerValues } from './composer';
const state = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  canConfigureReplies: false,
  save: undefined as ((values: ComposerValues) => Promise<unknown>) | undefined,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('@/hooks/convex/use-posts', () => ({
  useCreatePost: () => state.create,
  useUpdatePost: () => state.update,
}));
vi.mock('@/hooks/convex/use-events', () => ({
  useEventMembers: () => ({ event: { memberships: [] } }),
}));
vi.mock('./composer', () => ({
  DiscussionComposer: (props: {
    onSave: (values: ComposerValues) => Promise<unknown>;
    canConfigureReplies?: boolean;
  }) => {
    state.save = props.onSave;
    state.canConfigureReplies = Boolean(props.canConfigureReplies);
    return null;
  },
}));
beforeEach(() => vi.clearAllMocks());
it('keeps Event creation ownership and navigation when using the shared composer', async () => {
  render(<Editor eventId='event-one' />);
  await state.save?.({
    title: 'Picnic',
    content: '<p>Hello</p>',
    attachments: [],
    attachmentIdsToDelete: [],
  });
  expect(state.create).toHaveBeenCalledWith({
    eventId: 'event-one',
    title: 'Picnic',
    content: '<p>Hello</p>',
    attachments: [],
  });
  expect(state.push).toHaveBeenCalledWith('/event/event-one');
});
it('keeps canonical Event post IDs and attachment edits in one update', async () => {
  render(
    <Editor
      eventId='event-one'
      postData={{ id: 'post-one', title: 'Old', content: '<p>Old</p>' }}
    />
  );
  await state.save?.({
    title: 'New',
    content: '<p>New</p>',
    attachments: [],
    attachmentIdsToDelete: [],
  });
  expect(state.update).toHaveBeenCalledWith({
    postId: 'post-one',
    title: 'New',
    content: '<p>New</p>',
    attachmentsToAdd: [],
    attachmentIdsToDelete: [],
  });
  expect(state.push).toHaveBeenCalledWith('/event/event-one/post/post-one');
});

it('lets new Event posts publish with replies disabled but excludes lock state from later content edits', async () => {
  const created = render(<Editor eventId='event-one' />);
  expect(state.canConfigureReplies).toBe(true);
  await state.save?.({
    title: 'Read only update',
    content: '<p>News</p>',
    attachments: [],
    attachmentIdsToDelete: [],
    repliesDisabled: true,
  });
  expect(state.create).toHaveBeenCalledWith(
    expect.objectContaining({ repliesDisabled: true })
  );
  created.unmount();
  render(
    <Editor
      eventId='event-one'
      postData={{ id: 'post-one', title: 'Old', content: '<p>Old</p>' }}
    />
  );
  expect(state.canConfigureReplies).toBe(false);
  await state.save?.({
    title: 'Edited',
    content: '<p>Edited</p>',
    attachments: [],
    attachmentIdsToDelete: [],
    repliesDisabled: false,
  });
  expect(state.update.mock.calls[0][0]).not.toHaveProperty('repliesDisabled');
});
