/**
 * Tests for Progress component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('should render progress bar', () => {
    render(<Progress value={50} data-testid='progress' />);

    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Progress value={50} data-testid='progress' />);

    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('data-slot', 'progress');
  });

  it('should apply base styling', () => {
    render(<Progress value={50} data-testid='progress' />);

    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('relative');
    expect(progress).toHaveClass('h-4');
    expect(progress).toHaveClass('w-full');
    expect(progress).toHaveClass('overflow-hidden');
    expect(progress).toHaveClass('rounded-pill');
    expect(progress).toHaveClass('bg-secondary');
  });

  it('should merge custom className', () => {
    render(<Progress value={50} className='h-2' data-testid='progress' />);

    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('h-2');
  });

  it('should render indicator', () => {
    render(<Progress value={50} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-primary');
  });

  it('should apply transform based on value', () => {
    render(<Progress value={75} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('should handle 0 value', () => {
    render(<Progress value={0} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('should handle 100 value', () => {
    render(<Progress value={100} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('should handle undefined value', () => {
    render(<Progress data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('should have progressbar role', () => {
    render(<Progress value={50} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
