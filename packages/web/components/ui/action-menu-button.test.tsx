import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ActionMenu } from './action-menu';
import { MoreHorizontal } from 'lucide-react';
import { ActionMenuButton } from './action-menu-button';
import { DropdownMenuItem } from './dropdown-menu';

// Only the browser's viewport/touch capabilities are simulated; Radix and
// useMobile run normally in both responsive branches.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function MobileActions() {
  const [open, setOpen] = useState(false);
  return (
    <ActionMenu
      drawerTitle='Summer picnic actions'
      drawerContent={
        <button onClick={() => setOpen(false)}>Close actions</button>
      }
      contextMenuContent={null}
      sheetOpen={open}
      onSheetOpenChange={setOpen}
      onContextMenu={event => event.preventDefault()}
      onClick={() => {}}
    >
      <ActionMenuButton
        label='Actions for Summer picnic'
        onClick={() => setOpen(true)}
        onContextMenu={event => event.preventDefault()}
        dropdownContent={<DropdownMenuItem>Edit event</DropdownMenuItem>}
      >
        <MoreHorizontal />
      </ActionMenuButton>
    </ActionMenu>
  );
}

describe('ActionMenuButton', () => {
  it('opens a named mobile drawer that can be dismissed', async () => {
    vi.stubGlobal('innerWidth', 390);
    const user = userEvent.setup();
    // jsdom has no animation engine; finish Radix presence immediately.
    render(
      <>
        <style>{'* { animation-name: none !important; }'}</style>
        <MobileActions />
      </>
    );

    await user.click(
      screen.getByRole('button', { name: 'Actions for Summer picnic' })
    );
    expect(
      await screen.findByRole('dialog', { name: 'Summer picnic actions' })
    ).toBeInTheDocument();
    screen.getByRole('button', { name: 'Close actions' }).focus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
  it('names the mobile action and requests opening without submitting a form', async () => {
    vi.stubGlobal('innerWidth', 390);
    const user = userEvent.setup();
    const submit = vi.fn(event => event.preventDefault());
    const onClick = vi.fn();
    render(
      <form onSubmit={submit}>
        <ActionMenuButton
          label='Actions for Summer picnic'
          onClick={onClick}
          onContextMenu={vi.fn()}
          dropdownContent={<DropdownMenuItem>Edit event</DropdownMenuItem>}
        >
          <MoreHorizontal />
        </ActionMenuButton>
      </form>
    );

    const trigger = screen.getByRole('button', {
      name: 'Actions for Summer picnic',
    });
    await user.click(trigger);
    expect(onClick).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });
  it('names the desktop menu and returns focus after keyboard dismissal', async () => {
    vi.stubGlobal('innerWidth', 1200);
    Reflect.deleteProperty(window, 'ontouchstart');
    const user = userEvent.setup();
    render(
      <ActionMenuButton
        label='Actions for Summer picnic'
        onClick={vi.fn()}
        onContextMenu={vi.fn()}
        dropdownContent={<DropdownMenuItem>Edit event</DropdownMenuItem>}
      >
        <MoreHorizontal />
      </ActionMenuButton>
    );

    const trigger = screen.getByRole('button', {
      name: 'Actions for Summer picnic',
    });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('menuitem', { name: 'Edit event' })
    ).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
