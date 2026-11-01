import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Portal } from '../src';

test('a reader edits and runs a credential-free first Event simulation, retaining values across languages', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/integrator');
  const network = vi.spyOn(globalThis, 'fetch');
  render(<Portal />);
  const lesson = screen.getByRole('region', { name: 'First Event simulation' });
  expect(
    within(lesson).getByRole('heading', { name: 'Your finished Event' })
  ).toBeVisible();
  const title = within(lesson).getByLabelText('Event title');
  await user.clear(title);
  await user.type(title, 'Friday board games');
  for (const language of ['TypeScript', 'Python', 'cURL']) {
    await user.click(within(lesson).getByRole('tab', { name: language }));
    expect(within(lesson).getByRole('tabpanel')).toHaveTextContent(
      'Friday board games'
    );
  }
  await user.click(
    within(lesson).getByRole('button', { name: 'Run simulation' })
  );
  expect(
    within(lesson).getByRole('status', { name: 'Simulation response' })
  ).toHaveTextContent('Friday board games');
  expect(
    within(lesson).getByRole('article', { name: 'Simulated Event preview' })
  ).toHaveTextContent('Friday board games');
  expect(within(lesson).queryByLabelText(/API key/i)).not.toBeInTheDocument();
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
});

test('a lost response replays one retained Event, while changed or expired requests cannot create another', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/integrator');
  render(<Portal />);
  const lesson = within(
    screen.getByRole('region', { name: 'First Event simulation' })
  );
  await user.click(lesson.getByLabelText('Simulate a lost create response'));
  await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
  const response = lesson.getByRole('status', { name: 'Simulation response' });
  expect(response).toHaveTextContent('Outcome uncertain');
  await user.click(
    lesson.getByRole('button', { name: 'Replay retained create' })
  );
  expect(response).toHaveTextContent('event_fixture_001');
  expect(lesson.getByText('Simulated Events created: 1')).toBeVisible();
  await user.type(lesson.getByLabelText('Event title'), ' changed');
  await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
  expect(response).toHaveTextContent('409 Conflict');
  await user.clear(lesson.getByLabelText('Event title'));
  await user.type(
    lesson.getByLabelText('Event title'),
    'My first Groupi Event'
  );
  await user.click(lesson.getByText('Optional recovery exercises'));
  await user.selectOptions(
    lesson.getByLabelText('Recovery exercise'),
    'expired-request'
  );
  await user.click(
    lesson.getByRole('button', { name: 'Replay retained create' })
  );
  expect(response).toHaveTextContent('409 Expired request');
  expect(lesson.getByText('Simulated Events created: 1')).toBeVisible();
  await user.click(lesson.getByRole('button', { name: 'Reset simulation' }));
  expect(lesson.getByLabelText('Event title')).toHaveValue(
    'My first Groupi Event'
  );
  expect(
    lesson.getByRole('button', { name: 'Replay retained create' })
  ).toBeDisabled();
  expect(lesson.getByText('Simulated Events created: 0')).toBeVisible();
});

test('invalid input and denied authority leave the simulated Event unchanged and never send requests', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/integrator');
  render(<Portal />);
  const network = vi.spyOn(globalThis, 'fetch');
  const lesson = within(
    screen.getByRole('region', { name: 'First Event simulation' })
  );
  await user.clear(lesson.getByLabelText('Event title'));
  await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
  expect(
    lesson.getByRole('status', { name: 'Simulation response' })
  ).toHaveTextContent('400 Bad Request');
  await user.type(lesson.getByLabelText('Event title'), 'A permitted Event');
  await user.click(lesson.getByText('Optional recovery exercises'));
  for (const [scenario, failure] of [
    ['expired', '401'],
    ['wrong-instance', 'Wrong instance'],
    ['denied', '403'],
  ]) {
    await user.selectOptions(
      lesson.getByLabelText('Recovery exercise'),
      scenario
    );
    await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
    expect(
      lesson.getByRole('status', { name: 'Simulation response' })
    ).toHaveTextContent(failure);
    expect(lesson.getByText('Simulated Events created: 0')).toBeVisible();
  }
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
});

test('Run against my account opens local-only instructions and copies a complete example without taking a credential', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/integrator');
  render(<Portal />);
  const network = vi.spyOn(globalThis, 'fetch');
  const lesson = within(
    screen.getByRole('region', { name: 'First Event simulation' })
  );
  await user.click(
    lesson.getByRole('button', { name: 'Run against my account' })
  );
  const local = within(
    lesson.getByRole('region', { name: 'Run locally, not in this browser' })
  );
  expect(
    local.getByText(/Keep your real API key outside this portal/)
  ).toBeVisible();
  await user.click(
    local.getByRole('button', {
      name: 'Copy example: Local TypeScript workflow',
    })
  );
  const copied = await navigator.clipboard.readText();
  expect(copied).toContain('GROUPI_API_KEY');
  expect(copied).toContain('GROUPI_ALLOW_CREATE');
  expect(copied).toContain('groupi-first-event.json');
  expect(lesson.queryByLabelText(/API key/i)).not.toBeInTheDocument();
  expect(lesson.getByText('Simulated Events created: 0')).toBeVisible();
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
});

test('language tabs work with arrow keys and returning to a lesson discards its synthetic request', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/integrator');
  const view = render(<Portal />);
  let lesson = within(
    screen.getByRole('region', { name: 'First Event simulation' })
  );
  lesson.getByRole('tab', { name: 'TypeScript' }).focus();
  await user.keyboard('{ArrowRight}');
  expect(lesson.getByRole('tab', { name: 'Python' })).toHaveFocus();
  expect(lesson.getByRole('tab', { name: 'Python' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
  await user.click(screen.getByRole('link', { name: 'API reference' }));
  window.history.replaceState({}, '', '/v2/integrator');
  window.dispatchEvent(new PopStateEvent('popstate'));
  lesson = within(
    await screen.findByRole('region', { name: 'First Event simulation' })
  );
  expect(lesson.getByText('Simulated Events created: 0')).toBeVisible();
  await user.click(lesson.getByRole('button', { name: 'Run simulation' }));
  view.unmount();
  render(<Portal />);
  expect(screen.getByText('Simulated Events created: 0')).toBeVisible();
});

test('the finished private widget previews loading, empty, success and error states without a public feed', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/event-widget');
  render(<Portal />);
  const widget = within(
    screen.getByRole('region', { name: 'Private Event widget simulation' })
  );
  expect(
    widget.getByRole('article', { name: 'Private widget preview' })
  ).toHaveTextContent('My first Groupi Event');
  const network = vi.spyOn(globalThis, 'fetch');
  for (const [state, expected] of [
    ['loading', 'Loading permitted Events'],
    ['empty', 'No Events yet'],
    ['error', 'Unable to read Events'],
    ['success', 'My first Groupi Event'],
  ]) {
    await user.selectOptions(
      widget.getByLabelText('Widget fixture state'),
      state
    );
    await user.click(
      widget.getByRole('button', { name: 'Refresh simulation' })
    );
    expect(
      widget.getByRole('status', { name: 'Widget state' })
    ).toHaveTextContent(expected);
  }
  expect(
    widget.getByText(/private local preview, not a public feed/)
  ).toBeVisible();
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
});
