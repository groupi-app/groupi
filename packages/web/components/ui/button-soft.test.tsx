import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Soft lift button', () => {
  it('announces pending while preventing duplicate activation', async () => {
    const activate = vi.fn();
    render(
      <Button
        presentation='soft'
        isLoading
        loadingText='Saving changes'
        onClick={activate}
      >
        Save changes
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Saving changes' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(activate).not.toHaveBeenCalled();
  });
  it('keeps a pending slotted link named and blocks its destination', async () => {
    const activate = vi.fn();
    render(
      <Button presentation='soft' asChild isLoading onClick={activate}>
        <a href='#saved'>Save changes</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Save changes' });
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(link);
    expect(activate).not.toHaveBeenCalled();
  });
});
