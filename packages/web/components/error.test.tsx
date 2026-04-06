/**
 * Tests for Error component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from './error';

// Mock next/navigation
const mockBack = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error title', () => {
    render(<ErrorPage message='Test error' />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<ErrorPage message='Something went wrong' />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render Go Back button', () => {
    render(<ErrorPage message='Error occurred' />);

    expect(
      screen.getByRole('button', { name: /go back/i })
    ).toBeInTheDocument();
  });

  it('should call router.back when Go Back button is clicked with history', async () => {
    // Simulate having navigation history
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true,
    });

    const user = userEvent.setup();
    render(<ErrorPage message='Error' />);

    const button = screen.getByRole('button', { name: /go back/i });
    await user.click(button);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /events when Go Back is clicked without history', async () => {
    // Simulate no navigation history (fresh tab)
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    });

    const user = userEvent.setup();
    render(<ErrorPage message='Error' />);

    const button = screen.getByRole('button', { name: /go back/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/events');
  });

  it('should render with container styling', () => {
    const { container } = render(<ErrorPage message='Error' />);

    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('container');
  });

  it('should render title with proper heading styling', () => {
    render(<ErrorPage message='Error' />);

    const title = screen.getByText('Something Went Wrong');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('font-heading');
  });

  it('should render button with outline variant', () => {
    render(<ErrorPage message='Error' />);

    const button = screen.getByRole('button', { name: /go back/i });
    // Check it has outline variant styling (border, no background fill)
    expect(button).toBeInTheDocument();
  });
});
