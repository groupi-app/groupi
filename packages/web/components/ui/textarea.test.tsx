/**
 * Tests for Textarea component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('should render textarea element', () => {
    render(<Textarea />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('data-slot', 'textarea');
  });

  it('should apply base styling', () => {
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('flex');
    expect(textarea).toHaveClass('min-h-[80px]');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
    expect(textarea).toHaveClass('border');
  });

  it('should merge custom className', () => {
    render(<Textarea className="h-40" data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('h-40');
  });

  it('should accept placeholder', () => {
    render(<Textarea placeholder="Enter description..." />);

    expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'This is a multi-line\ntext input');

    expect(textarea).toHaveValue('This is a multi-line\ntext input');
  });

  it('should call onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support disabled state', () => {
    render(<Textarea disabled data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeDisabled();
  });

  it('should support required attribute', () => {
    render(<Textarea required data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeRequired();
  });

  it('should support rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should support maxLength attribute', () => {
    render(<Textarea maxLength={500} data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('should pass through additional attributes', () => {
    render(<Textarea id="description" name="bio" data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('id', 'description');
    expect(textarea).toHaveAttribute('name', 'bio');
  });

  it('should render as textarea element', () => {
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea.tagName).toBe('TEXTAREA');
  });
});
