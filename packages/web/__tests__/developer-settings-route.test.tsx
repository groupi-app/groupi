import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeveloperSettings from '@/app/(settings)/settings/developer/page';
import { settingsConfig } from '@/config/settings';
vi.mock('@/components/templates', () => ({
  SettingsPageTemplate: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock('@/features/authorization', () => ({
  BoundedKeysSettings: () => <section>Bounded keys fixture</section>,
  DeveloperAppsSettings: () => <section>Owned apps fixture</section>,
}));
vi.mock('@/app/(settings)/settings/components/api-keys-settings', () => ({
  ApiKeysSettings: () => <section>Legacy keys fixture</section>,
}));
it('exposes developer tools on their own category without mounting account form state', () => {
  const { container } = render(<DeveloperSettings />);
  expect(
    screen.getByRole('heading', { name: 'Developer' })
  ).toBeInTheDocument();
  expect(screen.getByText('Bounded keys fixture')).toBeInTheDocument();
  expect(screen.getByText('Owned apps fixture')).toBeInTheDocument();
  expect(screen.getByText('Legacy keys fixture')).toBeInTheDocument();
  expect(container.querySelector('#account-form')).toBeNull();
  expect(
    settingsConfig.settingsNav.find(item => item.href === '/settings/developer')
  ).toMatchObject({ title: 'Developer' });
  expect(
    settingsConfig.settingsNav.find(item => item.href === '/settings/account')
  ).toMatchObject({ title: 'Account' });
});
