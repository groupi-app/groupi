/**
 * Tests for FooterCopyright component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterCopyright } from './footer-copyright';

// Mock the site config
vi.mock('@/config/site', () => ({
  siteConfig: {
    name: 'Groupi',
    description: 'Event planning app',
  },
}));

describe('FooterCopyright', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render copyright symbol', () => {
    render(<FooterCopyright />);

    expect(screen.getByText(/©/)).toBeInTheDocument();
  });

  it('should render site name', () => {
    render(<FooterCopyright />);

    expect(screen.getByText(/Groupi/)).toBeInTheDocument();
  });

  it('should render current year', () => {
    render(<FooterCopyright />);

    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('should have proper text styling', () => {
    render(<FooterCopyright />);

    const paragraph = screen.getByText(/©.*Groupi/);
    expect(paragraph.tagName).toBe('P');
    expect(paragraph).toHaveClass('text-sm');
  });
});
