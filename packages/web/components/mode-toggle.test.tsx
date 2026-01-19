/**
 * Tests for ModeToggle component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeToggle } from './mode-toggle';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'light',
  }),
}));

describe('ModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle button', () => {
    render(<ModeToggle />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have accessible label for screen readers', () => {
    render(<ModeToggle />);

    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should set theme to light when Light option is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click Light option
    const lightOption = screen.getByText('Light');
    await user.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should set theme to dark when Dark option is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Click Dark option
    await user.click(screen.getByText('Dark'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should set theme to system when System option is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Click System option
    await user.click(screen.getByText('System'));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('should render sun and moon icons', () => {
    render(<ModeToggle />);

    // Icons should be rendered (they have sr-only text)
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
