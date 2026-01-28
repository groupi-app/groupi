/**
 * Tests for Toggle component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './toggle';

describe('Toggle', () => {
  it('should render toggle button', () => {
    render(<Toggle>Toggle</Toggle>);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Toggle data-testid='toggle'>Toggle</Toggle>);

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('data-slot', 'toggle');
  });

  it('should apply default variant styling', () => {
    render(<Toggle data-testid='toggle'>Toggle</Toggle>);

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('bg-transparent');
  });

  it('should apply outline variant styling', () => {
    render(
      <Toggle variant='outline' data-testid='toggle'>
        Toggle
      </Toggle>
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('border');
    expect(toggle).toHaveClass('border-input');
  });

  it('should apply default size styling', () => {
    render(<Toggle data-testid='toggle'>Toggle</Toggle>);

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('h-10');
    expect(toggle).toHaveClass('px-3');
  });

  it('should apply sm size styling', () => {
    render(
      <Toggle size='sm' data-testid='toggle'>
        Toggle
      </Toggle>
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('h-9');
    expect(toggle).toHaveClass('px-2.5');
  });

  it('should apply lg size styling', () => {
    render(
      <Toggle size='lg' data-testid='toggle'>
        Toggle
      </Toggle>
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('h-11');
    expect(toggle).toHaveClass('px-5');
  });

  it('should be unpressed by default', () => {
    render(<Toggle>Toggle</Toggle>);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('should be pressed when pressed prop is true', () => {
    render(<Toggle pressed>Toggle</Toggle>);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('should toggle state on click', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Toggle disabled>Toggle</Toggle>);

    const toggle = screen.getByRole('button');
    expect(toggle).toBeDisabled();
  });

  it('should merge custom className', () => {
    render(
      <Toggle className='custom-class' data-testid='toggle'>
        Toggle
      </Toggle>
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('custom-class');
  });

  it('should render children', () => {
    render(<Toggle>Bold</Toggle>);

    expect(screen.getByText('Bold')).toBeInTheDocument();
  });
});
