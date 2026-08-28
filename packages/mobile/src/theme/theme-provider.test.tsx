import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  savePreference: vi.fn(),
  setState: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useCallback: <T,>(callback: T) => callback,
    useEffect: vi.fn(),
    useMemo: <T,>(factory: () => T) => factory(),
    useState: <T,>(initial: T) => [initial, mocks.setState],
  };
});

vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useMutation: () => mocks.savePreference,
  useQuery: (query: string) =>
    query === 'getThemePreferences'
      ? {
          _id: 'preference-1',
          _creationTime: 123,
          personId: 'person-1',
          updatedAt: 456,
          selectedThemeType: 'base',
          selectedThemeId: 'groupi-light',
          useSystemPreference: true,
          systemLightThemeId: 'groupi-light',
          systemDarkThemeId: 'groupi-dark',
        }
      : [],
}));

vi.mock('convex/_generated/api', () => ({
  api: {
    themes: {
      queries: {
        getThemePreferences: 'getThemePreferences',
        getCustomThemes: 'getCustomThemes',
      },
      mutations: { saveThemePreference: 'saveThemePreference' },
    },
  },
}));

vi.mock('uniwind', () => ({
  Uniwind: {
    setTheme: vi.fn(),
    updateCSSVariables: vi.fn(),
  },
}));

import { ThemeProvider } from './theme-provider';

interface ThemeProviderValue {
  setTheme: (id: string, customThemeId?: string) => Promise<boolean>;
}

function getProviderValue() {
  const element = ThemeProvider({ children: null }) as ReactElement<{
    children: ReactNode;
    value: ThemeProviderValue;
  }>;
  return element.props.value;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.savePreference.mockResolvedValue('preference-1');
  });

  it('persists only validated fields when selecting a base theme', async () => {
    const saved = await getProviderValue().setTheme('groupi-dark');

    expect(saved).toBe(true);
    expect(mocks.savePreference).toHaveBeenCalledWith({
      selectedThemeType: 'base',
      selectedThemeId: 'groupi-dark',
      selectedCustomThemeId: undefined,
      useSystemPreference: false,
      systemLightThemeId: 'groupi-light',
      systemDarkThemeId: 'groupi-dark',
    });
  });
});
