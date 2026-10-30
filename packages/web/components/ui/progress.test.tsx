/**
 * Tests for Progress component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it.each([
    { value: -1, max: 4, expected: 0, width: '0%' },
    { value: 9, max: 4, expected: 4, width: '100%' },
    { value: 50, max: 0, expected: 50, width: '50%' },
  ])(
    'keeps visual and announced limits aligned for $value / $max',
    ({ value, max, expected, width }) => {
      render(<Progress aria-label='Files' value={value} max={max} />);

      const progress = screen.getByRole('progressbar', { name: 'Files' });
      expect(progress).toHaveAttribute('aria-valuenow', String(expected));
      expect(progress.firstElementChild).toHaveStyle({ width });
    }
  );

  it.each([undefined, null, Number.NaN, Infinity])(
    'announces an unknown value as indeterminate (%s)',
    value => {
      render(<Progress aria-label='Upload' value={value} />);

      const progress = screen.getByRole('progressbar', { name: 'Upload' });
      expect(progress).not.toHaveAttribute('aria-valuenow');
      expect(progress).not.toHaveAttribute('aria-valuetext');
      expect(progress.firstElementChild).toHaveStyle({
        width: '0%',
      });
    }
  );
  it('shows and announces half completion with a custom maximum', () => {
    render(<Progress aria-label='Files' value={2} max={4} />);

    const progress = screen.getByRole('progressbar', { name: 'Files' });
    expect(progress).toHaveAttribute('aria-valuenow', '2');
    expect(progress).toHaveAttribute('aria-valuemax', '4');
    expect(progress).toHaveAttribute('aria-valuetext', '50%');
    expect(progress.firstElementChild).toHaveStyle({
      width: '50%',
    });
  });
  it('announces determinate progress on the same scale as the indicator', () => {
    render(<Progress aria-label='Upload' value={75} />);

    const progress = screen.getByRole('progressbar', { name: 'Upload' });
    expect(progress).toHaveAttribute('aria-valuenow', '75');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuetext', '75%');
  });
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

  it('shows the rendered completion fraction', () => {
    render(<Progress value={75} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ width: '75%' });
  });

  it('should handle 0 value', () => {
    render(<Progress value={0} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ width: '0%' });
  });

  it('should handle 100 value', () => {
    render(<Progress value={100} data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ width: '100%' });
  });

  it('should handle undefined value', () => {
    render(<Progress data-testid='progress' />);

    const indicator = screen
      .getByTestId('progress')
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ width: '0%' });
  });

  it('should have progressbar role', () => {
    render(<Progress value={50} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
