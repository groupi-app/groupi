/**
 * Tests for Checkbox component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('should render checkbox', () => {
    render(<Checkbox />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Checkbox data-testid='checkbox' />);

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
  });

  it('should apply base styling', () => {
    render(<Checkbox data-testid='checkbox' />);

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('h-4');
    expect(checkbox).toHaveClass('w-4');
    expect(checkbox).toHaveClass('rounded-sm');
    expect(checkbox).toHaveClass('border-2');
    expect(checkbox).toHaveClass('border-primary');
  });

  it('should merge custom className', () => {
    render(<Checkbox className='mr-2' data-testid='checkbox' />);

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('mr-2');
  });

  it('should be unchecked by default', () => {
    render(<Checkbox />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('should call onCheckedChange on click', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should toggle checked state', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox checked onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('should pass through id attribute', () => {
    render(<Checkbox id='terms-checkbox' />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'terms-checkbox');
  });

  it('should accept name prop without error', () => {
    // Radix UI handles name internally for form submission
    expect(() => render(<Checkbox name='accept-terms' />)).not.toThrow();
  });

  it('should support value attribute', () => {
    render(<Checkbox value='yes' data-testid='checkbox' />);

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('value', 'yes');
  });

  it('should work with label', () => {
    render(
      <>
        <Checkbox id='terms' />
        <label htmlFor='terms'>Accept terms</label>
      </>
    );

    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
  });
});
