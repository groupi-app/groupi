import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  type ThemeTokens,
  baseThemeRegistry,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
} from '@groupi/shared/design/themes';

interface ThemeContextValue {
  themeId: string;
  tokens: ThemeTokens;
  isDark: boolean;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const defaultThemeId =
    systemColorScheme === 'dark'
      ? DEFAULT_DARK_THEME_ID
      : DEFAULT_LIGHT_THEME_ID;

  const [themeId, setThemeId] = useState(defaultThemeId);

  // Sync with system preference when no explicit override
  useEffect(() => {
    setThemeId(
      systemColorScheme === 'dark'
        ? DEFAULT_DARK_THEME_ID
        : DEFAULT_LIGHT_THEME_ID
    );
  }, [systemColorScheme]);

  const theme = baseThemeRegistry[themeId];
  const tokens = theme?.tokens ?? baseThemeRegistry[DEFAULT_LIGHT_THEME_ID].tokens;
  const isDark = theme?.mode === 'dark';

  const setTheme = useCallback((id: string) => {
    if (baseThemeRegistry[id]) {
      setThemeId(id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, tokens, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
