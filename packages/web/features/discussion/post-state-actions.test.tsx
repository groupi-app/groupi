import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PostStateMenuItems,
  usePostStateActions,
  type PostState,
} from './post-state-actions';
import { ConvexError } from 'convex/values';
import type { Id } from '@/convex/_generated/dataModel';
const fixture = vi.hoisted(() => ({ replies: vi.fn(), pin: vi.fn() }));
vi.mock('@/hooks/convex/use-post-controls', () => ({
  useSetPostRepliesDisabled: () => fixture.replies,
  useSetPostPinned: () => fixture.pin,
}));
const post: PostState = {
  _id: 'post' as Id<'posts'>,
  canSetRepliesDisabled: true,
  canPin: true,
  repliesRevision: 0,
  pinRevision: 0,
};
function Menu({
  value = post,
  onComplete,
}: {
  value?: PostState;
  onComplete?: () => void;
}) {
  const state = usePostStateActions(value, onComplete);
  return (
    <>
      <PostStateMenuItems state={state} menu='drawer' />
    </>
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  fixture.replies.mockResolvedValue({ revision: 1, repliesDisabled: true });
  fixture.pin.mockResolvedValue({ revision: 1, pinned: true, pinnedAt: 100 });
});
describe('post reply and pin actions', () => {
  it('scopes acknowledged locks and pins to the post ID when the menu component is reused', async () => {
    const { rerender } = render(<Menu />);
    fireEvent.click(screen.getByRole('button', { name: 'Lock replies' }));
    await screen.findByRole('button', { name: 'Open replies' });
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await screen.findByRole('button', { name: 'Unpin post' });
    rerender(<Menu value={{ ...post, _id: 'next-post' as Id<'posts'> }} />);
    expect(screen.getByRole('button', { name: 'Lock replies' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Pin post' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Lock replies' }));
    await waitFor(() => expect(fixture.replies).toHaveBeenCalledTimes(2));
    expect(fixture.replies.mock.calls[1][0]).toEqual({
      postId: 'next-post',
      repliesDisabled: true,
      expectedRevision: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await waitFor(() => expect(fixture.pin).toHaveBeenCalledTimes(2));
    expect(fixture.pin.mock.calls[1][0]).toEqual({
      postId: 'next-post',
      pinned: true,
      expectedRevision: 0,
    });
  });
  it('keeps a reused menu locked until an old request settles without applying its result or closing the new menu', async () => {
    let finish!: (result: unknown) => void;
    fixture.replies.mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    const complete = vi.fn();
    const { rerender } = render(<Menu onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lock replies' }));
    rerender(
      <Menu
        onComplete={complete}
        value={{ ...post, _id: 'next-post' as Id<'posts'> }}
      />
    );
    const newLock = screen.getByRole('button', { name: 'Lock replies' });
    expect(newLock).toBeDisabled();
    fireEvent.click(newLock);
    expect(fixture.replies).toHaveBeenCalledTimes(1);
    await act(async () => finish({ revision: 8, repliesDisabled: true }));
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Lock replies' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Open replies' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lock replies' }));
    await waitFor(() => expect(fixture.replies).toHaveBeenCalledTimes(2));
    expect(fixture.replies.mock.calls[1][0]).toMatchObject({
      postId: 'next-post',
      expectedRevision: 0,
    });
  });
  it('does not carry a previous post error or a late rejection into a different post', async () => {
    fixture.pin.mockRejectedValueOnce(new Error('Old pin capacity error'));
    const { rerender } = render(<Menu />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await screen.findByRole('alert');
    rerender(<Menu value={{ ...post, _id: 'next-post' as Id<'posts'> }} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    let fail!: (error: Error) => void;
    fixture.pin.mockReturnValueOnce(
      new Promise((_, reject) => {
        fail = reject;
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    rerender(<Menu value={{ ...post, _id: 'third-post' as Id<'posts'> }} />);
    await act(async () => fail(new Error('Late failure from next-post')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pin post' })).toBeEnabled();
  });

  it('uses only server-granted controls and keeps pins manager-only', () => {
    const { rerender } = render(
      <Menu value={{ ...post, canSetRepliesDisabled: false, canPin: false }} />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<Menu value={{ ...post, canPin: false }} />);
    expect(
      screen.getByRole('button', { name: 'Lock replies' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pin post' })
    ).not.toBeInTheDocument();
  });
  it('waits for acknowledgement, blocks duplicates and uses the acknowledged revision before query catchup', async () => {
    let finish!: (result: unknown) => void;
    fixture.replies.mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    render(<Menu />);
    const lock = screen.getByRole('button', { name: 'Lock replies' });
    fireEvent.click(lock);
    fireEvent.click(lock);
    expect(lock).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pin post' })).toBeDisabled();
    expect(fixture.replies).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Open replies' })
    ).not.toBeInTheDocument();
    await act(async () => finish({ revision: 1, repliesDisabled: true }));
    fixture.replies.mockResolvedValueOnce({
      revision: 2,
      repliesDisabled: false,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open replies' }));
    await waitFor(() => expect(fixture.replies).toHaveBeenCalledTimes(2));
    expect(fixture.replies.mock.calls[1][0]).toEqual({
      postId: 'post',
      repliesDisabled: false,
      expectedRevision: 1,
    });
  });
  it('retains old state and offers retry after a denied pin or capacity failure', async () => {
    fixture.pin.mockRejectedValueOnce(
      new ConvexError({
        code: 'PIN_LIMIT',
        message: 'Unpin another post before pinning this one.',
      })
    );
    render(<Menu />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unpin another post'
    );
    expect(screen.getByRole('button', { name: 'Pin post' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await screen.findByRole('button', { name: 'Unpin post' });
    expect(fixture.pin).toHaveBeenCalledTimes(2);
  });
  it.each([false, true])(
    'shows only the structured server message for a transported Convex failure (serialized=%s)',
    async serialized => {
      const data = {
        code: 'PIN_LIMIT',
        message:
          'Three posts are already pinned. Unpin one before pinning another.',
      };
      const error = new ConvexError(serialized ? JSON.stringify(data) : data);
      error.message =
        '[CONVEX M(posts/mutations:setPinned)] [Request ID: synthetic] Server Error Uncaught ConvexError at controls.ts Called by client';
      fixture.pin.mockRejectedValueOnce(error);
      render(<Menu />);
      fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(data.message);
      expect(screen.getByRole('alert').textContent).toBe(data.message);
      expect(screen.getByRole('button', { name: 'Pin post' })).toBeEnabled();
      expect(
        screen.queryByText(/CONVEX|Request ID|controls\.ts/)
      ).not.toBeInTheDocument();
    }
  );
  it('uses concise recovery text for an unexpected technical error', async () => {
    fixture.pin.mockRejectedValueOnce(
      new Error('Internal transport failure at private-server-file.ts')
    );
    render(<Menu />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to update this post. Try again.'
    );
    expect(screen.queryByText(/private-server-file/)).not.toBeInTheDocument();
  });
  it('uses a newer authoritative revision over an older local acknowledgement', async () => {
    const { rerender } = render(<Menu />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await screen.findByRole('button', { name: 'Unpin post' });
    rerender(<Menu value={{ ...post, pinRevision: 3, pinnedAt: undefined }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    await waitFor(() => expect(fixture.pin).toHaveBeenCalledTimes(2));
    expect(fixture.pin.mock.calls[1][0]).toMatchObject({
      expectedRevision: 3,
      pinned: true,
    });
  });
});
