import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog';

function OverlayDialog() {
  const [protectedAction, setProtectedAction] = useState(false);
  return (
    <Dialog defaultOpen>
      <DialogContent
        preventOverlayClose={protectedAction}
        onInteractOutside={event => {
          // Match callers which guard Radix's outside-pointer dismissal as
          // well as the overlay's separate click-to-close behavior.
          if (protectedAction) event.preventDefault();
        }}
      >
        <DialogTitle>Overlay dismissal</DialogTitle>
        <DialogDescription>Review an action before leaving.</DialogDescription>
        <button onClick={() => setProtectedAction(value => !value)}>
          {protectedAction
            ? 'Resume ordinary dismissal'
            : 'Protect this action'}
        </button>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog overlay dismissal', () => {
  it('dismisses an ordinary dialog when clicking its overlay', async () => {
    const user = userEvent.setup();
    render(<OverlayDialog />);
    // The backdrop has no accessible role; use its public browser surface.
    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps protected content interactive and resumes overlay dismissal after protection ends', async () => {
    const user = userEvent.setup();
    render(<OverlayDialog />);
    await user.click(
      screen.getByRole('button', { name: 'Protect this action' })
    );
    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Resume ordinary dismissal' })
    );
    expect(
      screen.getByRole('button', { name: 'Protect this action' })
    ).toBeVisible();
    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
