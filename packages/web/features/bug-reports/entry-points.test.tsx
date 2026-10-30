import { render, screen, cleanup } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SiteFooter } from '@/components/site-footer';
import SupportPage from '@/app/support/page';
import { ErrorDisplay } from '@/components/error-display';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
it.each([SiteFooter, SupportPage, ErrorDisplay])(
  'offers a direct public report link',
  Component => {
    render(<Component />);
    expect(screen.getByRole('link', { name: /report a bug/i })).toHaveAttribute(
      'href',
      '/report-bug'
    );
    cleanup();
  }
);
