import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Portal } from '../src';
test('a reader distinguishes the planned realtime design from the current API reference', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.click(screen.getByRole('link', { name: 'Realtime design' }));
  expect(
    screen.getByRole('heading', { name: 'Realtime and API/SDK evolution' })
  ).toBeVisible();
  expect(
    screen.getByText(/Proposed · not a supported quickstart/)
  ).toBeVisible();
  expect(screen.queryByLabelText('API version')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Download OpenAPI schema' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Download Markdown' })
  ).toHaveAttribute('href', '/exports/api-sdk-evolution.md');
  expect(screen.getByRole('link', { name: 'Convex realtime' })).toHaveAttribute(
    'href',
    'https://docs.convex.dev/realtime'
  );
});
test('a public reader chooses the first Event learning journey', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  expect(
    screen.getByRole('link', { name: 'Create your first Event' })
  ).toBeVisible();
  expect(
    screen.queryByRole('link', { name: 'Contribute to Groupi' })
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('link', { name: 'Create your first Event' })
  );
  expect(
    screen.getByRole('heading', { name: 'Read and create your first event' })
  ).toBeVisible();
  expect(
    screen.getByText(/empty list is a successful response/i)
  ).toBeVisible();
});
test('a contributor follows the Introduction link while add-on references remain available', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/v2/contributor#setup');
  render(<Portal />);
  expect(screen.getByRole('heading', { name: 'Introduction' })).toBeVisible();
  expect(window.location.pathname).toBe('/v2/introduction');
  expect(window.location.hash).toBe('#contributing');
  expect(
    screen.getByRole('link', { name: 'Contribution guide' })
  ).toHaveAttribute(
    'href',
    'https://github.com/groupi-app/groupi/blob/main/CONTRIBUTING.md'
  );
  await user.click(screen.getByRole('link', { name: 'Add-ons' }));
  expect(
    screen.getByRole('heading', { name: 'Choose an add-on author path' })
  ).toBeVisible();
  expect(screen.getByText(/^import \{ defineAddonHandler \}/)).toBeVisible();
  expect(screen.getByText(/schemaVersion/)).toBeVisible();
});
test('a reader selects versioned API reference and generated CLI command anchors', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.click(screen.getByRole('link', { name: 'API reference' }));
  expect(
    screen.getByRole('heading', { name: 'REST v2 API reference' })
  ).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'GET /api/v2/events' })
  ).toBeVisible();
  await user.selectOptions(screen.getByLabelText('API version'), 'v1');
  expect(
    screen.getByRole('heading', { name: 'REST v1 API reference' })
  ).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'CLI reference' }));
  expect(
    screen.getByRole('heading', { name: 'groupi events create' })
  ).toBeVisible();
  expect(
    within(screen.getByRole('navigation', { name: 'On this page' }))
      .getByRole('link', { name: 'groupi events create' })
      .getAttribute('href')
  ).toBe('/cli/0.1.0/reference#groupi-events-create');
});
test('search retrieves exact identifiers, highlights passages and recovers from no results', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.type(
    screen.getByRole('searchbox', { name: 'Search developer docs' }),
    'groupi events create'
  );
  const results = screen.getByRole('list', { name: 'Search results' });
  expect(within(results).getAllByRole('link')[0]).toHaveAttribute(
    'href',
    '/cli/0.1.0/reference#groupi-events-create'
  );
  expect(results.querySelector('mark')).not.toBeNull();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'quasar wombat telemetry');
  expect(screen.getByText(/No passages found/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Reset filters' })).toBeVisible();
});
test('a reader downloads canonical docs and copies an executable example', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.click(
    screen.getByRole('link', { name: 'Create your first Event' })
  );
  expect(
    screen.getByRole('link', { name: 'Download Markdown' })
  ).toHaveAttribute('href', '/exports/integrator.md');
  expect(
    screen.getByRole('link', { name: 'Download plain text' })
  ).toHaveAttribute('href', '/exports/integrator.txt');
  await user.click(screen.getByText('Show complete local typescript example'));
  await user.click(
    screen.getByRole('button', {
      name: 'Copy example: Local TypeScript example',
    })
  );
  expect(
    screen.getByRole('status', { name: 'Code copy result' })
  ).toHaveTextContent('Copied example');
  expect(await navigator.clipboard.readText()).toContain(
    '/events?pagination=cursor&limit=20'
  );
});
test('a developer simulates empty-list success, permission denial and uncertain-create replay without credentials', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.click(screen.getByRole('link', { name: 'API explorer' }));
  expect(
    screen.getByRole('heading', { name: 'Simulated API explorer' })
  ).toBeVisible();
  expect(screen.queryByLabelText(/API key/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'List events' }));
  expect(
    screen.getByRole('status', { name: 'Demo response' })
  ).toHaveTextContent('"items": []');
  await user.selectOptions(screen.getByLabelText('Demo identity'), 'attendee');
  await user.click(screen.getByRole('button', { name: 'Create event' }));
  expect(
    screen.getByRole('status', { name: 'Demo response' })
  ).toHaveTextContent('403');
  await user.selectOptions(screen.getByLabelText('Demo identity'), 'organizer');
  await user.click(screen.getByLabelText('Simulate a lost create response'));
  await user.click(screen.getByRole('button', { name: 'Create event' }));
  expect(
    screen.getByRole('status', { name: 'Demo response' })
  ).toHaveTextContent('Outcome uncertain');
  await user.click(
    screen.getByRole('button', { name: 'Replay retained create' })
  );
  expect(
    screen.getByRole('status', { name: 'Demo response' })
  ).toHaveTextContent('demo-event-1');
  await user.click(screen.getByRole('button', { name: 'List events' }));
  expect(
    screen
      .getByRole('status', { name: 'Demo response' })
      .textContent?.match(/demo-event-1/g)
  ).toHaveLength(1);
});
test('a reader filters unavailable content and navigates passage links with keyboard', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.type(screen.getByRole('searchbox'), 'self-host Linux Compose');
  expect(
    within(screen.getByRole('list', { name: 'Search results' })).getAllByRole(
      'link'
    )[0]
  ).toHaveAttribute('href', '/v2/self-hosting#status');
  await user.selectOptions(screen.getByLabelText('Availability'), 'Current');
  expect(screen.getByText(/No passages found/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Reset filters' }));
  const first = within(
    screen.getByRole('list', { name: 'Search results' })
  ).getAllByRole('link')[0];
  first.focus();
  await user.keyboard('{Enter}');
  expect(
    screen.getByRole('heading', { name: 'Self-hosting status' })
  ).toBeVisible();
  expect(window.location.hash).toBe('#status');
  expect(
    screen.getByText(/Proposed · not a supported quickstart/)
  ).toBeVisible();
});
test('an unknown reader route offers recovery instead of pretending to be a valid guide', () => {
  window.history.replaceState({}, '', '/v2/missing-guide');
  render(<Portal />);
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Return to developer home' })
  ).toHaveAttribute('href', '/');
});
test('an unversioned HTTP operation lookup finds the recommended v2 exact route and respects explicit v1 intent', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.type(screen.getByRole('searchbox'), 'GET /events');
  expect(
    within(screen.getByRole('list', { name: 'Search results' })).getAllByRole(
      'link'
    )[0]
  ).toHaveAttribute('href', '/v2/reference/api#get-events');
  await user.selectOptions(screen.getByLabelText('Search version'), 'v1');
  expect(
    within(screen.getByRole('list', { name: 'Search results' })).getAllByRole(
      'link'
    )[0]
  ).toHaveAttribute('href', '/v1/reference/api#get-events');
});
test('demo prerequisite failures explain expired credentials, wrong instances and unavailable versions without a live request', async () => {
  const user = userEvent.setup();
  render(<Portal />);
  await user.click(screen.getByRole('link', { name: 'API explorer' }));
  for (const [scenario, expected] of [
    ['expired', '401'],
    ['wrong-instance', 'Wrong instance'],
    ['unsupported-version', 'Unsupported API version'],
    ['unavailable', 'Upcoming capability'],
  ] as const) {
    await user.selectOptions(screen.getByLabelText('Demo scenario'), scenario);
    await user.click(screen.getByRole('button', { name: 'List events' }));
    expect(
      screen.getByRole('status', { name: 'Demo response' })
    ).toHaveTextContent(expected);
  }
});
