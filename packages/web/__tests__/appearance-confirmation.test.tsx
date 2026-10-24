import 'tsconfig-paths/register';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMutation, useQuery } from 'convex/react';
import { ThemeProvider } from '@/providers/theme-provider';
import AppearanceSettings from '@/app/(settings)/settings/appearance/page';

vi.mock('@/convex/_generated/api', () => ({
  api: {
    themes: {
      queries: {
        getThemePreferences: 'preferences',
        getCustomThemes: 'customThemes',
      },
      mutations: {
        saveThemePreference: 'save',
        deleteCustomTheme: 'delete',
        createCustomTheme: 'create',
        updateCustomTheme: 'update',
      },
    },
  },
}));
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  Authenticated: ({ children }: { children: React.ReactNode }) => children,
  Unauthenticated: () => null,
  AuthLoading: () => null,
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  vi.stubGlobal('innerWidth', 390);
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('keeps failed custom theme deletion available for retry and closes after successful deletion', async () => {
  const user = userEvent.setup();
  const remove = Object.assign(
    vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(undefined),
    { withOptimisticUpdate: vi.fn() }
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(useQuery).mockImplementation((...args) =>
    String(args[0]) === 'customThemes'
      ? [
          {
            _id: 'customTheme',
            name: 'My custom theme',
            baseThemeId: 'groupi-light',
            mode: 'light',
            tokenOverrides: {},
          },
        ]
      : null
  );
  vi.mocked(useMutation).mockImplementation(mutation =>
    String(mutation) === 'delete'
      ? remove
      : Object.assign(vi.fn(), { withOptimisticUpdate: vi.fn() })
  );
  render(
    <>
      <style>{'* { animation-name: none !important; }'}</style>
      <ThemeProvider>
        <AppearanceSettings />
      </ThemeProvider>
    </>
  );
  await user.click(
    screen.getByRole('button', { name: 'Actions for theme My custom theme' })
  );
  screen.getByRole('button', { name: 'Delete Theme' }).focus();
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Please try again'
  );
  expect(screen.getByRole('dialog')).toHaveTextContent('Delete Custom Theme');
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(remove).toHaveBeenCalledTimes(2);
});
