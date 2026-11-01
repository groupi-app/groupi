import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { EditableDateTimeItem } from './editable-date-time-item';

it('retains time editing and separately removes a complete option', async () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  render(
    <EditableDateTimeItem
      option={{ id: 'option', start: new Date(2026, 10, 15, 18) }}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
  const time = screen.getByLabelText('Start time');
  fireEvent.focus(time);
  fireEvent.change(time, { target: { value: '19:30' } });
  fireEvent.blur(time);
  expect(onUpdate).toHaveBeenCalledWith({
    start: new Date(2026, 10, 15, 19, 30),
  });
  await userEvent.click(screen.getByRole('button', { name: 'Remove option' }));
  expect(onDelete).toHaveBeenCalledOnce();
});
