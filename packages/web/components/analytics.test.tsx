/**
 * Tests for Analytics component
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Analytics } from './analytics';

// Mock Vercel analytics
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

describe('Analytics', () => {
  it('should render Vercel Analytics component', () => {
    const { getByTestId } = render(<Analytics />);

    expect(getByTestId('vercel-analytics')).toBeInTheDocument();
  });

  it('should render SpeedInsights component', () => {
    const { getByTestId } = render(<Analytics />);

    expect(getByTestId('speed-insights')).toBeInTheDocument();
  });

  it('should render both analytics components', () => {
    const { getByTestId } = render(<Analytics />);

    expect(getByTestId('vercel-analytics')).toBeInTheDocument();
    expect(getByTestId('speed-insights')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => render(<Analytics />)).not.toThrow();
  });
});
