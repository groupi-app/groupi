import { render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { Editor } from '@/app/(event)/event/[eventId]/post/[postId]/components/editor';
import type { ComposerValues } from './composer';
const state = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
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
  }) => {
    state.save = props.onSave;
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
