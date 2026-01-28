/**
 * Tests for RepliesIcons component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepliesIcons from './replies-icons';

// Mock the Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid='avatar' className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- Test mock, not production code
    <img data-testid='avatar-image' src={src || ''} alt={alt || ''} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span data-testid='avatar-fallback'>{children}</span>
  ),
}));

describe('RepliesIcons', () => {
  it('should render nothing for empty replies array', () => {
    const { container } = render(<RepliesIcons replies={[]} />);

    expect(container.querySelectorAll('[data-testid="avatar"]')).toHaveLength(
      0
    );
  });

  it('should render single author avatar', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: {
          id: 'author-1',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/john.jpg',
          },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
    expect(screen.getByTestId('avatar-image')).toHaveAttribute(
      'src',
      'https://example.com/john.jpg'
    );
  });

  it('should render multiple author avatars', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: {
          id: 'author-1',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: null,
          },
        },
      },
      {
        createdAt: new Date('2025-01-17T11:00:00Z'),
        author: {
          id: 'author-2',
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            image: null,
          },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(2);
  });

  it('should show max 3 authors', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: {
          id: 'a1',
          user: { name: 'User 1', email: 'u1@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T11:00:00Z'),
        author: {
          id: 'a2',
          user: { name: 'User 2', email: 'u2@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T12:00:00Z'),
        author: {
          id: 'a3',
          user: { name: 'User 3', email: 'u3@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T13:00:00Z'),
        author: {
          id: 'a4',
          user: { name: 'User 4', email: 'u4@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T14:00:00Z'),
        author: {
          id: 'a5',
          user: { name: 'User 5', email: 'u5@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(3);
  });

  it('should deduplicate authors', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: {
          id: 'author-1',
          user: { name: 'John', email: 'john@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T11:00:00Z'),
        author: {
          id: 'author-1',
          user: { name: 'John', email: 'john@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T12:00:00Z'),
        author: {
          id: 'author-2',
          user: { name: 'Jane', email: 'jane@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(2);
  });

  it('should skip replies without author', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: null,
      },
      {
        createdAt: new Date('2025-01-17T11:00:00Z'),
        author: undefined,
      },
      {
        createdAt: new Date('2025-01-17T12:00:00Z'),
        author: {
          id: 'author-1',
          user: { name: 'John', email: 'john@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
  });

  it('should handle _creationTime timestamp', () => {
    const replies = [
      {
        _creationTime: Date.now(),
        author: {
          id: 'author-1',
          user: { name: 'John', email: 'john@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
  });

  it('should handle number timestamp', () => {
    const replies = [
      {
        createdAt: Date.now(),
        author: {
          id: 'author-1',
          user: { name: 'John', email: 'john@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
  });

  it('should sort by recency and show most recent authors first', () => {
    const replies = [
      {
        createdAt: new Date('2025-01-17T10:00:00Z'),
        author: {
          id: 'old-author',
          user: { name: 'Old', email: 'old@test.com', image: null },
        },
      },
      {
        createdAt: new Date('2025-01-17T15:00:00Z'),
        author: {
          id: 'new-author',
          user: { name: 'New', email: 'new@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    const avatars = screen.getAllByTestId('avatar');
    expect(avatars).toHaveLength(2);
    // The first avatar should be from the most recent reply
    expect(avatars[0]).toHaveTextContent('NE');
  });

  it('should display initials in fallback', () => {
    const replies = [
      {
        createdAt: new Date(),
        author: {
          id: 'author-1',
          user: { name: 'John Doe', email: 'john@test.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
  });

  it('should use email for fallback when name is null', () => {
    const replies = [
      {
        createdAt: new Date(),
        author: {
          id: 'author-1',
          user: { name: null, email: 'test@example.com', image: null },
        },
      },
    ];

    render(<RepliesIcons replies={replies} />);

    // getInitialsFromName uses email fallback
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('TE');
  });
});
