/**
 * Tests for NumberBadge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NumberBadge } from './number-badge';

describe('NumberBadge', () => {
  it('should render children', () => {
    render(
      <NumberBadge num={5}>
        <span>Content</span>
      </NumberBadge>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should display the number', () => {
    render(
      <NumberBadge num={5}>
        <span>Content</span>
      </NumberBadge>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display zero', () => {
    render(
      <NumberBadge num={0}>
        <span>Content</span>
      </NumberBadge>
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should display large numbers', () => {
    render(
      <NumberBadge num={999}>
        <span>Content</span>
      </NumberBadge>
    );

    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('should display negative numbers', () => {
    render(
      <NumberBadge num={-3}>
        <span>Content</span>
      </NumberBadge>
    );

    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('should render with button as child', () => {
    render(
      <NumberBadge num={10}>
        <button>Click me</button>
      </NumberBadge>
    );

    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should apply proper styling to badge', () => {
    render(
      <NumberBadge num={5}>
        <span>Content</span>
      </NumberBadge>
    );

    const badge = screen.getByText('5');
    expect(badge).toHaveClass('absolute');
    expect(badge).toHaveClass('bg-red-600');
    expect(badge).toHaveClass('rounded-full');
  });
});
