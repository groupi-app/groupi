import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { RsvpChoices } from './rsvp-choices';

it('selects each response without submitting and exposes current selection', async () => {
  const onChange = vi.fn();
  const submit = vi.fn(e => e.preventDefault());
  render(
    <form onSubmit={submit}>
      <RsvpChoices value='MAYBE' onChange={onChange} />
    </form>
  );
  expect(screen.getByRole('button', { name: 'Maybe' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const user = userEvent.setup();
  for (const [label, value] of [
    ['Yes', 'YES'],
    ['Maybe', 'MAYBE'],
    ['No', 'NO'],
  ]) {
    await user.click(screen.getByRole('button', { name: label }));
    expect(onChange).toHaveBeenLastCalledWith(value);
  }
  expect(submit).not.toHaveBeenCalled();
});
