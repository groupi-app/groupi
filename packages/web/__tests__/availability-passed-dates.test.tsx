import { useLifecycleClock } from '@groupi/shared/hooks';
import { classifyEventLifecycle } from '@groupi/shared/utils';
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { AvailabilityCard } from '@/app/(event)/event/[eventId]/components/availability-card';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('labels passed dates, locks new responses and retains vote totals at the boundary', () => {
  vi.useFakeTimers();
  const now = Date.parse('2026-04-05T12:00:00Z');
  vi.setSystemTime(now);
  const pdt = {
    _id: 'date',
    eventId: 'event',
    dateTime: now + 1000,
    availabilities: [],
  } as unknown as ComponentProps<typeof AvailabilityCard>['pdt'];
  const setFormAnswer = vi.fn();
  render(
    <AvailabilityCard
      pdt={pdt}
      savedStatus='YES'
      formAnswers={[{ potentialDateTimeId: 'date', answer: 'no' }]}
      setFormAnswer={setFormAnswer}
      setFormNote={vi.fn()}
      index={0}
    />
  );
  expect(screen.getByRole('button', { name: 'Available' })).not.toBeDisabled();
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByText('Passed')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Available' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Available' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    screen.getByRole('textbox', { name: 'Availability note' })
  ).toBeDisabled();
  expect(setFormAnswer).not.toHaveBeenCalled();
});

it('updates no-end lifecycle at local midnight without a network write', () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse('2026-03-09T03:59:59Z'));
  const event = {
    chosenDateTime: Date.parse('2026-03-08T05:00:00Z'),
    timezone: 'America/New_York',
  };
  const { result } = renderHook(() =>
    classifyEventLifecycle(event, useLifecycleClock())
  );
  expect(result.current).toBe('UPCOMING');
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe('COMPLETED');
});
