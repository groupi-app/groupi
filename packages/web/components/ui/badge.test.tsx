import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it.each([
    'default',
    'secondary',
    'destructive',
    'success',
    'warning',
    'info',
    'outline',
  ] as const)(
    'keeps %s labels readable as information rather than an action',
    variant => {
      render(<Badge variant={variant}>Pending invitation</Badge>);
      expect(screen.getByText('Pending invitation')).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    }
  );
  it('preserves caller semantics and attributes', () => {
    render(
      <Badge role='status' aria-label='3 unread invitations' id='invitations'>
        3
      </Badge>
    );
    expect(
      screen.getByRole('status', { name: '3 unread invitations' })
    ).toHaveTextContent('3');
    expect(screen.getByRole('status')).toHaveAttribute('id', 'invitations');
  });
});
