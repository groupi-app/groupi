import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card, CardAction, CardActions, CardHeader, CardTitle } from './card';

describe('Interactive Card composition', () => {
  it('keeps the main action and a secondary action independently keyboard operable', async () => {
    const open = vi.fn();
    const save = vi.fn();
    render(
      <Card treatment='interactive'>
        <CardHeader>
          <CardTitle>
            <CardAction onClick={open}>Summer picnic</CardAction>
          </CardTitle>
          <CardActions>
            <button onClick={save}>Save picnic</button>
          </CardActions>
        </CardHeader>
      </Card>
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Summer picnic' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledOnce();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save picnic' })).toHaveFocus();
    await user.keyboard(' ');
    expect(save).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
  });
  it('skips an unavailable primary action while retaining secondary controls', async () => {
    const open = vi.fn();
    const save = vi.fn();
    render(
      <Card treatment='interactive'>
        <CardHeader>
          <CardTitle>
            <CardAction disabled onClick={open}>
              Unavailable theme
            </CardAction>
          </CardTitle>
          <CardActions>
            <button onClick={save}>Preview theme</button>
          </CardActions>
        </CardHeader>
      </Card>
    );
    const user = userEvent.setup();
    const primary = screen.getByRole('button', { name: 'Unavailable theme' });
    expect(primary).toBeDisabled();
    await user.click(primary);
    expect(open).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Preview theme' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(save).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
  });
});
