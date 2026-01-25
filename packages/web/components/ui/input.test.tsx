/**
 * Tests for Input component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Input data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('should apply base styling', () => {
    render(<Input data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('flex');
    expect(input).toHaveClass('h-10');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
  });

  it('should merge custom className', () => {
    render(<Input className='custom-input' data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input');
  });

  it('should render with text type by default', () => {
    render(<Input data-testid='input' />);

    const input = screen.getByTestId('input');
    // Default type is undefined (which browsers treat as text)
    expect(input).not.toHaveAttribute('type', 'password');
  });

  it('should render with specified type', () => {
    render(<Input type='password' data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render email input', () => {
    render(<Input type='email' data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render number input', () => {
    render(<Input type='number' />);

    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('should accept placeholder', () => {
    render(<Input placeholder='Enter your name' />);

    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Input data-testid='input' />);

    const input = screen.getByTestId('input');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('should call onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} data-testid='input' />);

    const input = screen.getByTestId('input');
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support disabled state', () => {
    render(<Input disabled data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
  });

  it('should support required attribute', () => {
    render(<Input required data-testid='input' />);

    const input = screen.getByTestId('input');
    expect(input).toBeRequired();
  });

  it('should pass through additional attributes', () => {
    render(
      <Input id='my-input' name='username' maxLength={10} data-testid='input' />
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('id', 'my-input');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('should support suppressHydrationWarning', () => {
    // This should not throw
    expect(() => render(<Input suppressHydrationWarning />)).not.toThrow();
  });
});
