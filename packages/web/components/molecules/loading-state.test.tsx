import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './loading-state';

describe('LoadingState', () => {
  it('announces readable loading feedback when the soft treatment has no message', () => {
    render(<LoadingState presentation='soft' />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });
});
