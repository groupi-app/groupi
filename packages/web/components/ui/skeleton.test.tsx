/**
 * Tests for Skeleton component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('should render a div element', () => {
    render(<Skeleton data-testid='skeleton' />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.tagName).toBe('DIV');
  });

  it('should apply animation class', () => {
    render(<Skeleton data-testid='skeleton' />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should apply rounded styling', () => {
    render(<Skeleton data-testid='skeleton' />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('should apply muted background', () => {
    render(<Skeleton data-testid='skeleton' />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('should merge custom className', () => {
    render(<Skeleton className='h-4 w-[250px]' data-testid='skeleton' />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-[250px]');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should pass through additional HTML attributes', () => {
    render(
      <Skeleton data-testid='skeleton' id='my-skeleton' aria-label='Loading' />
    );

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'my-skeleton');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('should allow custom styles', () => {
    render(
      <Skeleton style={{ width: 100, height: 20 }} data-testid='skeleton' />
    );

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '100px', height: '20px' });
  });

  it('should render children if provided', () => {
    render(
      <Skeleton data-testid='skeleton'>
        <span>Loading content</span>
      </Skeleton>
    );

    expect(screen.getByText('Loading content')).toBeInTheDocument();
  });
});
