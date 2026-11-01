import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { guides } from '../src/content';
import { DocumentReader } from '../src/components/organisms/document-reader';

test('Introduction gives readers an integration starting point and one contribution link', () => {
  const page = guides.find(page => page.id === 'introduction');
  expect(page, 'Introduction is publicly readable').toBeDefined();
  render(<DocumentReader page={page!} />);
  expect(screen.getByRole('heading', { name: 'Introduction' })).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Create your first Event' })
  ).toHaveAttribute('href', '/v2/integrator');
  expect(
    screen.getByRole('link', { name: 'Build with an agent — Markdown' })
  ).toHaveAttribute('href', '/agents.md');
  expect(
    screen.getByRole('link', { name: 'Contribution guide' })
  ).toHaveAttribute(
    'href',
    'https://github.com/groupi-app/groupi/blob/main/CONTRIBUTING.md'
  );
});

test('first Event reader exposes all local language paths and honest recovery before a real write', () => {
  render(
    <DocumentReader page={guides.find(page => page.id === 'integrator')!} />
  );
  expect(
    screen.getByRole('heading', { name: 'Run against my account' })
  ).toBeVisible();
  for (const name of [
    'Local TypeScript example',
    'Local Python example',
    'Local cURL example',
  ]) {
    expect(screen.getByRole('heading', { name })).toBeVisible();
  }
  expect(screen.getByText(/No visibility field is sent/)).toBeVisible();
  expect(screen.getByText(/unchanged payload.*24 hours/)).toBeVisible();
});

test('agent reader routes five integration goals with explicit delegated and privacy boundaries', () => {
  const page = guides.find(page => page.id === 'agents');
  expect(page).toBeDefined();
  render(<DocumentReader page={page!} />);
  for (const [name, href] of [
    ['First own-account Event', '/v2/integrator.md'],
    ['Private Event widget', '/v2/event-widget.md'],
    ['Group Events', '/v2/group-events.md'],
    ['Event updates', '/v2/event-updates.md'],
    ['Connect another user', '/v2/connect-users.md'],
  ])
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  expect(
    screen.getByText(/documentation access is not account authorization/i)
  ).toBeVisible();
  expect(screen.getByText(/global \/profile is denied/)).toBeVisible();
  expect(screen.queryByText(/pnpm install|git clone/)).not.toBeInTheDocument();
});

test('Group Event recipe explains independent participation and current sharing authority', () => {
  const page = guides.find(page => page.id === 'group-events');
  expect(page).toBeDefined();
  render(<DocumentReader page={page!} />);
  expect(
    screen.getByText(/Group managers receive no Event-management role/)
  ).toBeVisible();
  expect(
    screen.getByText(/sharing creates no invitation, membership or RSVP/)
  ).toBeVisible();
  expect(
    screen.getByText(/inspect current audiences before resubmitting/)
  ).toBeVisible();
});

test('private widget reader shows its outcome before setup and distinguishes states and publishing', () => {
  const page = guides.find(page => page.id === 'event-widget');
  expect(page).toBeDefined();
  render(<DocumentReader page={page!} />);
  expect(screen.getByText(/Loading.*Empty.*Success.*Error/)).toBeVisible();
  expect(screen.getByText(/^Prerequisites:.*loopback-only/)).toBeVisible();
  expect(
    screen.getByText(/read access is not permission to republish/)
  ).toBeVisible();
});

test('update recipe does not invent create replay or turn write authority into read permission', () => {
  const page = guides.find(page => page.id === 'event-updates');
  expect(page).toBeDefined();
  render(<DocumentReader page={page!} />);
  expect(
    screen.getByText(/write-only grant.*does not permit read-back/)
  ).toBeVisible();
  expect(
    screen.getByText(/Do not assume Idempotency-Key protects PATCH/)
  ).toBeVisible();
});

test('connecting another user uses consent identity and states disconnect limitations', () => {
  const page = guides.find(page => page.id === 'connect-users');
  expect(page).toBeDefined();
  render(<DocumentReader page={page!} />);
  expect(
    screen.getByText(/^Use authorization code with PKCE S256.*state.*nonce/)
  ).toBeVisible();
  expect(screen.getByText(/Do not call global REST \/profile/)).toBeVisible();
  expect(
    screen.getByText(/does not erase copied data or terminate the app/)
  ).toBeVisible();
});
