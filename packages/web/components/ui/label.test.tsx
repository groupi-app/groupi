/**
 * Tests for Label component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('should render children', () => {
    render(<Label>Email Address</Label>);

    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Label data-testid='label'>Username</Label>);

    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('data-slot', 'label');
  });

  it('should apply base styling', () => {
    render(<Label data-testid='label'>Field Label</Label>);

    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
    expect(label).toHaveClass('leading-none');
  });

  it('should merge custom className', () => {
    render(
      <Label className='text-red-500' data-testid='label'>
        Error Label
      </Label>
    );

    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-red-500');
    expect(label).toHaveClass('font-medium');
  });

  it('should support htmlFor attribute', () => {
    render(<Label htmlFor='email-input'>Email</Label>);

    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('should pass through additional attributes', () => {
    render(
      <Label id='username-label' data-testid='label'>
        Username
      </Label>
    );

    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('id', 'username-label');
  });

  it('should support suppressHydrationWarning', () => {
    // This should not throw
    expect(() =>
      render(<Label suppressHydrationWarning>Safe Label</Label>)
    ).not.toThrow();
  });

  it('should render as label element', () => {
    render(<Label data-testid='label'>Field</Label>);

    const label = screen.getByTestId('label');
    expect(label.tagName).toBe('LABEL');
  });

  it('should associate with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor='test-input'>Test Field</Label>
        <input id='test-input' />
      </>
    );

    const label = screen.getByText('Test Field');
    const input = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');
  });
});
