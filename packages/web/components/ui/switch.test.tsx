/**
 * Tests for Switch component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './switch';

describe('Switch', () => {
  it('should render switch', () => {
    render(<Switch />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Switch data-testid='switch' />);

    const switchEl = screen.getByTestId('switch');
    expect(switchEl).toHaveAttribute('data-slot', 'switch');
  });

  it('should apply base styling', () => {
    render(<Switch data-testid='switch' />);

    const switchEl = screen.getByTestId('switch');
    expect(switchEl).toHaveClass('inline-flex');
    expect(switchEl).toHaveClass('rounded-full');
  });

  it('should merge custom className', () => {
    render(<Switch className='mt-2' data-testid='switch' />);

    const switchEl = screen.getByTestId('switch');
    expect(switchEl).toHaveClass('mt-2');
  });

  it('should be unchecked by default', () => {
    render(<Switch />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
  });

  it('should be checked when checked prop is true', () => {
    render(<Switch checked />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'checked');
  });

  it('should toggle state on click', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);

    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
  });

  it('should not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} />);

    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('should render thumb element', () => {
    render(<Switch data-testid='switch' />);

    const thumb = screen
      .getByTestId('switch')
      .querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it('should pass through id attribute', () => {
    render(<Switch id='notifications-switch' />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('id', 'notifications-switch');
  });

  it('should accept name prop without error', () => {
    // Radix UI handles name internally for form submission
    expect(() => render(<Switch name='notifications' />)).not.toThrow();
  });
});
