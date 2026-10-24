import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EventTabFilter, type EventTabValue } from './event-tab-filter';

function EventFilters() {
  const [value, setValue] = useState<EventTabValue>('upcoming');
  return (
    <EventTabFilter
      value={value}
      onChange={setValue}
      counts={{ upcoming: 3, hosting: 2, attended: 0 }}
    />
  );
}

describe('EventTabFilter', () => {
  it('lets keyboard users change event filters with arrow keys', async () => {
    const user = userEvent.setup();
    render(<EventFilters />);
    const upcoming = screen.getByRole('tab', { name: /Upcoming/ });
    const hosting = screen.getByRole('tab', { name: /Hosting/ });

    await user.click(upcoming);
    expect(upcoming).toHaveFocus();
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(hosting).toHaveFocus());
    expect(hosting).toHaveAttribute('aria-selected', 'true');
    expect(upcoming).toHaveAttribute('aria-selected', 'false');
  });
});
