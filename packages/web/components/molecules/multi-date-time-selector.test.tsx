import 'tsconfig-paths/register';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiDateTimeSelector } from './multi-date-time-selector';

vi.mock('convex/react', () => ({ useAction: () => vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('explains an invalid time when adding a date, then allows correction', async () => {
  vi.setSystemTime(new Date(2026, 9, 24, 10));
  const user = userEvent.setup();
  render(<MultiDateTimeSelector showSmartInput={false} onChange={() => {}} />);
  await user.click(
    screen.getByRole('button', { name: /Sunday, October 25th, 2026/ })
  );
  fireEvent.change(screen.getByLabelText('Time'), { target: { value: '' } });
  await user.click(screen.getByRole('button', { name: 'Add 1 Option' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Enter a valid start time.'
  );
  fireEvent.change(screen.getByLabelText('Time'), {
    target: { value: '18:00' },
  });
  await user.click(screen.getByRole('button', { name: 'Add 1 Option' }));
  expect(screen.getByText('Options (1)')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('explains an end time before the start without losing the selected date', async () => {
  vi.setSystemTime(new Date(2026, 9, 24, 10));
  const user = userEvent.setup();
  render(<MultiDateTimeSelector showSmartInput={false} onChange={() => {}} />);
  await user.click(
    screen.getByRole('button', { name: /Sunday, October 25th, 2026/ })
  );
  await user.click(screen.getByRole('switch'));
  fireEvent.change(screen.getByLabelText('Start Time'), {
    target: { value: '18:00' },
  });
  fireEvent.change(screen.getByLabelText('End Time'), {
    target: { value: '17:00' },
  });
  await user.click(screen.getByRole('button', { name: 'Add 1 Option' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Choose an end time after the start time.'
  );
  expect(screen.getByRole('button', { name: 'Add 1 Option' })).toBeEnabled();
  expect(screen.getByText('Options (0)')).toBeVisible();
});

it('explains when the selected date and time are in the past', async () => {
  vi.setSystemTime(new Date(2026, 9, 24, 10));
  const user = userEvent.setup();
  render(<MultiDateTimeSelector showSmartInput={false} onChange={() => {}} />);
  await user.click(
    screen.getByRole('button', { name: /Saturday, October 24th, 2026/ })
  );
  fireEvent.change(screen.getByLabelText('Time'), {
    target: { value: '09:00' },
  });
  await user.click(screen.getByRole('button', { name: 'Add 1 Option' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Choose a date and time in the future.'
  );
  expect(screen.getByText('Options (0)')).toBeVisible();
});
