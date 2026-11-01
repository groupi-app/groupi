import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RepliesSection } from '@/app/(event)/event/[eventId]/post/[postId]/components/replies-section';
const fixture = vi.hoisted(() => ({ locked: false, typing: vi.fn() }));
vi.mock('@/hooks/convex/use-posts', () => ({
  usePostDetail: () => ({
    post: { replies: [], repliesDisabled: fixture.locked },
  }),
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'viewer' } }),
}));
vi.mock('@/hooks/convex/use-presence', () => ({
  useCurrentUserPostPresence: () => ({ roomToken: undefined }),
  useTypingIndicators: () => [],
}));
vi.mock('@/components/typing-indicator', () => ({
  TypingIndicator: () => null,
}));
vi.mock(
  '@/app/(event)/event/[eventId]/post/[postId]/components/reply-list',
  () => ({
    ReplyList: ({
      newestReplyRef,
    }: {
      newestReplyRef: React.RefObject<HTMLDivElement | null>;
    }) => (
      <div ref={newestReplyRef}>
        <p>Existing reply remains readable</p>
        <button>Edit existing reply</button>
      </div>
    ),
  })
);
vi.mock(
  '@/app/(event)/event/[eventId]/post/[postId]/components/reply-form',
  () => ({
    default: function ReplyFormFixture({ disabled }: { disabled: boolean }) {
      const [value, setValue] = useState('');
      return (
        <input
          aria-label='New reply draft'
          disabled={disabled}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      );
    },
  })
);
const props = {
  postId: 'post',
  userId: 'viewer',
  replies: [],
  userMembership: { role: 'ATTENDEE' },
  post: { event: {}, repliesDisabled: false },
} as unknown as Parameters<typeof RepliesSection>[0];
beforeEach(() => {
  fixture.locked = false;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('locked Event post replies', () => {
  it('keeps existing replies and edit access readable, hides the new composer, and restores its draft when reopened', () => {
    const { rerender } = render(<RepliesSection {...props} />);
    const input = screen.getByRole('textbox', { name: 'New reply draft' });
    fireEvent.change(input, { target: { value: 'Keep my unsent reply' } });
    fixture.locked = true;
    rerender(<RepliesSection {...props} />);
    expect(
      screen.getByText('Existing reply remains readable')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit existing reply' })
    ).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Replies are locked.');
    expect(
      screen.queryByRole('textbox', { name: 'New reply draft' })
    ).not.toBeInTheDocument();
    expect(input).toBeDisabled();
    fixture.locked = false;
    rerender(<RepliesSection {...props} />);
    expect(screen.getByRole('textbox', { name: 'New reply draft' })).toBe(
      input
    );
    expect(input).toHaveValue('Keep my unsent reply');
    expect(input).toBeEnabled();
  });
});
