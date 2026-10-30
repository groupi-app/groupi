import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaperDivider } from './paper-divider';

describe('PaperDivider', () => {
  it('announces orientation only when the separator conveys structure', () => {
    render(<PaperDivider decorative={false} orientation='vertical' />);
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    );
  });
});
