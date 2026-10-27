import { afterAll, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFunctionName } from 'convex/server';
import AccountSettings from '@/app/(settings)/settings/account/page';

const calls = vi.hoisted(() => ({
  profile: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
}));
const restoreAlias = await vi.hoisted(async () => {
  const { default: Module } = await import('node:module');
  const { resolve } = await import('node:path');
  const resolver = Module as typeof Module & {
    _resolveFilename: (request: string, ...args: unknown[]) => string;
  };
  const original = resolver._resolveFilename;
  const apiPath = resolve(process.cwd(), '../../convex/_generated/api.js');
  resolver._resolveFilename = function (request, ...args) {
    return original.call(
      this,
      request === '@/convex/_generated/api' ? apiPath : request,
      ...args
    );
  };
  return () => {
    resolver._resolveFilename = original;
  };
});
afterAll(restoreAlias);
vi.unmock('@/convex/_generated/api');
vi.mock('convex/react', () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'auth/queries:getCurrentUserAndPerson')
      return {
        user: { username: 'reader', email: 'reader@example.test' },
        person: {},
      };
    if (name === 'users/queries:checkUsernameAvailability')
      return { available: true };
    return [];
  },
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref) === 'delegatedApps/mutations:registerApp'
      ? calls.register
      : vi.fn(),
}));
vi.mock('@/components/auth/auth-wrappers', () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => children,
  Unauthenticated: () => null,
  AuthLoading: () => null,
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useLinkedAccounts: () => ({ accounts: [], refetch: vi.fn() }),
}));
vi.mock('@/hooks/convex', () => ({
  useUpdateUserProfile: () => calls.profile,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/settings/account',
  useRouter: () => ({ refresh: calls.refresh }),
}));
vi.mock('@/components/molecules', () => ({ EmptyState: () => null }));
vi.mock('@/components/templates', () => ({
  SettingsPageTemplate: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock('@/features/authorization', async () => ({
  DeveloperAppsSettings: (
    await import('@/features/authorization/developer-apps-settings')
  ).DeveloperAppsSettings,
  BoundedKeysSettings: () => null,
  ConnectedAppsSettings: () => null,
}));
vi.mock('@/app/(settings)/settings/components/email-management', () => ({
  EmailManagement: () => null,
}));
vi.mock('@/app/(settings)/settings/components/linked-accounts-list', () => ({
  LinkedAccountsList: () => null,
}));
vi.mock('@/app/(settings)/settings/components/passkey-settings', () => ({
  PasskeySettings: () => null,
}));
vi.mock('@/app/(settings)/settings/components/api-keys-settings', () => ({
  ApiKeysSettings: () => null,
}));
vi.mock('@/app/(settings)/settings/components/delete-account-modal', () => ({
  DeleteAccountModal: () => null,
}));

it('keeps everyday Account independent from Developer and preserves username dirty Save/Revert', async () => {
  calls.profile.mockResolvedValue(null);
  const user = userEvent.setup();
  const { container } = render(<AccountSettings />);
  expect(container.querySelector('form form')).toBeNull();
  expect(screen.queryByLabelText('App name')).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Developer settings' })
  ).toHaveAttribute('href', '/settings/developer');
  await user.clear(screen.getByPlaceholderText('Enter username'));
  await user.type(screen.getByPlaceholderText('Enter username'), 'newreader');
  expect(
    await screen.findByText('You have unsaved changes!')
  ).toBeInTheDocument();
  const unload = new Event('beforeunload', { cancelable: true });
  act(() => {
    window.dispatchEvent(unload);
  });
  expect(unload.defaultPrevented).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(calls.profile).toHaveBeenCalledTimes(1));
  expect(calls.profile).toHaveBeenCalledWith({
    username: 'newreader',
    name: 'reader@example.test',
  });
  expect(calls.register).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Revert' }));
  expect(screen.getByPlaceholderText('Enter username')).toHaveValue('reader');
  expect(
    screen.queryByText('You have unsaved changes!')
  ).not.toBeInTheDocument();
});
