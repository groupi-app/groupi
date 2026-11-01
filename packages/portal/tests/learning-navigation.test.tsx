import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Portal } from '../src';

test('a signed-out reader chooses learning or reference without a contributor course', () => {
  render(<Portal />);
  const navigation = within(
    screen.getByRole('navigation', { name: 'Developer navigation' })
  );
  expect(navigation.getByRole('link', { name: 'Learn' })).toHaveAttribute(
    'href',
    '/v2/introduction'
  );
  expect(navigation.getByRole('link', { name: 'Reference' })).toHaveAttribute(
    'href',
    '/v2/reference/api'
  );
  expect(
    screen.queryByRole('link', { name: 'Contribute to Groupi' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Create your first Event' })
  ).toHaveAttribute('href', '/v2/integrator');
  expect(
    screen.getByRole('link', { name: 'Build a private Event widget' })
  ).toHaveAttribute('href', '/v2/event-widget');
  expect(
    screen.getByRole('link', { name: 'Build with an agent' })
  ).toHaveAttribute('href', '/v2/agents');
});

test('the Introduction gives an agent a direct Markdown URL without navigating the app', async () => {
  window.history.replaceState({}, '', '/v2/introduction');
  render(<Portal />);
  expect(
    screen.getByRole('link', { name: 'View Markdown for agents' })
  ).toHaveAttribute('href', '/agents.md');
  expect(
    screen.getByRole('button', { name: 'Copy Markdown URL' })
  ).toBeVisible();
});
