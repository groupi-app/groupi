import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SettingsPageTemplate } from './settings-page-template';

afterEach(cleanup);

it('names the destination of a contextual back link', () => {
  render(
    <SettingsPageTemplate
      title='Event Settings'
      backHref='/event/123'
      backLabel='Event'
    >
      <p>Choose a category</p>
    </SettingsPageTemplate>
  );
  expect(screen.getByRole('link', { name: 'Event' })).toHaveAttribute(
    'href',
    '/event/123'
  );
});
