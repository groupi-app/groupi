/**
 * Tests for Avatar components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar', () => {
  it('should render with data-slot attribute', () => {
    render(<Avatar data-testid='avatar' />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-slot', 'avatar');
  });

  it('should apply base styling', () => {
    render(<Avatar data-testid='avatar' />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('relative');
    expect(avatar).toHaveClass('flex');
    expect(avatar).toHaveClass('h-10');
    expect(avatar).toHaveClass('w-10');
    expect(avatar).toHaveClass('rounded-avatar');
    expect(avatar).toHaveClass('overflow-hidden');
  });

  it('should merge custom className', () => {
    render(<Avatar className='h-12 w-12' data-testid='avatar' />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('h-12');
    expect(avatar).toHaveClass('w-12');
  });

  it('should render children', () => {
    render(
      <Avatar>
        <span data-testid='child'>Child</span>
      </Avatar>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('AvatarFallback', () => {
  it('should render with data-slot attribute', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid='avatar-fallback'>JD</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback');
  });

  it('should apply base styling', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid='avatar-fallback'>AB</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveClass('flex');
    expect(fallback).toHaveClass('h-full');
    expect(fallback).toHaveClass('w-full');
    expect(fallback).toHaveClass('items-center');
    expect(fallback).toHaveClass('justify-center');
    expect(fallback).toHaveClass('rounded-avatar');
    expect(fallback).toHaveClass('bg-muted');
  });

  it('should render children', () => {
    render(
      <Avatar>
        <AvatarFallback>XY</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('XY')).toBeInTheDocument();
  });

  it('should merge custom className', () => {
    render(
      <Avatar>
        <AvatarFallback className='bg-primary' data-testid='avatar-fallback'>
          ZZ
        </AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveClass('bg-primary');
  });
});

describe('Avatar composition', () => {
  it('should render complete avatar with fallback', () => {
    render(
      <Avatar data-testid='avatar'>
        <AvatarImage src='https://example.com/user.jpg' alt='User' />
        <AvatarFallback>US</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    // Fallback is visible until image loads
    expect(screen.getByText('US')).toBeInTheDocument();
  });

  it('should render avatar without children', () => {
    render(<Avatar data-testid='empty-avatar' />);

    expect(screen.getByTestId('empty-avatar')).toBeInTheDocument();
  });
});
