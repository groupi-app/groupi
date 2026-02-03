'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  baseThemeRegistry,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
  type BaseTheme,
} from '@groupi/shared/design/themes';

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  THEME_ID: 'groupi-theme-id',
  THEME_TYPE: 'groupi-theme-type',
  CUSTOM_THEME_CLASS: 'groupi-custom-theme-class',
  CUSTOM_THEME_CSS: 'groupi-custom-theme-css',
  SYSTEM_LIGHT: 'groupi-system-light',
  SYSTEM_DARK: 'groupi-system-dark',
} as const;

const STYLE_ELEMENT_ID = 'groupi-custom-theme-css';
const PRELOAD_STYLE_ID = 'custom-theme-overrides-preload';

type ThemeType = 'base' | 'custom' | 'system';
type ThemeMode = 'light' | 'dark';

// =============================================================================
// TYPES
// =============================================================================

export interface ThemeState {
  /** Current theme ID (base theme ID or custom theme ID) */
  themeId: string;
  /** Type of current theme */
  themeType: ThemeType;
  /** Resolved mode (light/dark) based on current theme */
  mode: ThemeMode;
  /** For system preference: which light theme to use */
  systemLightThemeId: string;
  /** For system preference: which dark theme to use */
  systemDarkThemeId: string;
}

export interface ThemeContextValue {
  /** Current theme state */
  state: ThemeState;
  /** Whether current theme is a custom theme */
  isCustomTheme: boolean;
  /** Current theme mode (light/dark) */
  resolvedMode: ThemeMode;
  /** Currently active theme ID */
  currentThemeId: string;
  /** All available base themes */
  baseThemes: BaseTheme[];
  /** Light base themes */
  lightThemes: BaseTheme[];
  /** Dark base themes */
  darkThemes: BaseTheme[];
  /** Get a base theme by ID */
  getBaseTheme: (id: string) => BaseTheme | undefined;
  /** Apply a base theme */
  setBaseTheme: (themeId: string) => void;
  /** Apply a custom theme with its CSS */
  setCustomTheme: (themeId: string, css: string) => void;
  /** Use system preference with specified light/dark themes */
  setSystemPreference: (lightThemeId: string, darkThemeId: string) => void;
  /** Clear custom theme CSS (used when switching away from custom) */
  clearCustomThemeCSS: () => void;

  // Legacy API compatibility
  setThemeById: (themeId: string, isCustom?: boolean) => void;
  applyCustomThemeCSS: (css: string) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useGroupiTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGroupiTheme must be used within a ThemeProvider');
  }
  return context;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getThemeMode(themeId: string): ThemeMode {
  const theme = baseThemeRegistry[themeId];
  return theme?.mode ?? 'light';
}

function applyThemeClass(themeClass: string): void {
  const html = document.documentElement;

  // Remove all existing theme classes
  const classesToRemove: string[] = [];
  html.classList.forEach(cls => {
    if (cls.startsWith('theme-') || cls === 'dark' || cls === 'light') {
      classesToRemove.push(cls);
    }
  });
  classesToRemove.forEach(cls => html.classList.remove(cls));

  // Add the new theme class
  html.classList.add(themeClass);
}

function injectCustomCSS(css: string): void {
  // Remove existing style elements
  removeCustomCSS();

  // Create and inject new style element
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function removeCustomCSS(): void {
  // Remove runtime style element
  const existing = document.getElementById(STYLE_ELEMENT_ID);
  if (existing) existing.remove();

  // Remove preload style element (from initial page load)
  const preload = document.getElementById(PRELOAD_STYLE_ID);
  if (preload) preload.remove();
}

function saveToStorage(state: ThemeState, customCSS?: string): void {
  try {
    console.log(
      '[ThemeProvider] saveToStorage called, themeType:',
      state.themeType,
      'hasCSS:',
      !!customCSS
    );
    localStorage.setItem(STORAGE_KEYS.THEME_ID, state.themeId);
    localStorage.setItem(STORAGE_KEYS.THEME_TYPE, state.themeType);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LIGHT, state.systemLightThemeId);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DARK, state.systemDarkThemeId);

    if (state.themeType === 'custom' && customCSS) {
      const themeClass = `theme-custom-${state.themeId}`;
      localStorage.setItem(STORAGE_KEYS.CUSTOM_THEME_CLASS, themeClass);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_THEME_CSS, customCSS);
      console.log(
        '[ThemeProvider] Saved custom theme to localStorage, class:',
        themeClass,
        'CSS length:',
        customCSS.length
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_THEME_CLASS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_THEME_CSS);
      console.log('[ThemeProvider] Cleared custom theme from localStorage');
    }
  } catch (e) {
    console.error('[ThemeProvider] saveToStorage error:', e);
  }
}

function loadFromStorage(): Partial<ThemeState> | null {
  try {
    const themeId = localStorage.getItem(STORAGE_KEYS.THEME_ID);
    const themeType = localStorage.getItem(
      STORAGE_KEYS.THEME_TYPE
    ) as ThemeType | null;
    const systemLight = localStorage.getItem(STORAGE_KEYS.SYSTEM_LIGHT);
    const systemDark = localStorage.getItem(STORAGE_KEYS.SYSTEM_DARK);
    const customClass = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEME_CLASS);
    const customCSS = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEME_CSS);

    console.log('[ThemeProvider] loadFromStorage:', {
      themeId,
      themeType,
      hasCustomClass: !!customClass,
      hasCustomCSS: !!customCSS,
      customCSSLength: customCSS?.length ?? 0,
    });

    if (!themeId) return null;

    return {
      themeId,
      themeType: themeType ?? 'base',
      systemLightThemeId: systemLight ?? DEFAULT_LIGHT_THEME_ID,
      systemDarkThemeId: systemDark ?? DEFAULT_DARK_THEME_ID,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<ThemeState>(() => {
    const stored = loadFromStorage();
    const systemPref =
      typeof window !== 'undefined' ? getSystemPreference() : 'light';

    if (stored) {
      // Determine mode based on stored state
      let mode: ThemeMode;
      if (stored.themeType === 'system') {
        const activeThemeId =
          systemPref === 'dark'
            ? (stored.systemDarkThemeId ?? DEFAULT_DARK_THEME_ID)
            : (stored.systemLightThemeId ?? DEFAULT_LIGHT_THEME_ID);
        mode = getThemeMode(activeThemeId);
      } else if (stored.themeType === 'custom') {
        // For custom themes, we need to look up the base theme
        // The mode will be determined by ThemeSync when it loads the custom theme
        mode = systemPref;
      } else {
        mode = getThemeMode(stored.themeId ?? DEFAULT_LIGHT_THEME_ID);
      }

      return {
        themeId: stored.themeId ?? DEFAULT_LIGHT_THEME_ID,
        themeType: stored.themeType ?? 'base',
        mode,
        systemLightThemeId: stored.systemLightThemeId ?? DEFAULT_LIGHT_THEME_ID,
        systemDarkThemeId: stored.systemDarkThemeId ?? DEFAULT_DARK_THEME_ID,
      };
    }

    // Default: use system preference
    const defaultThemeId =
      systemPref === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
    return {
      themeId: defaultThemeId,
      themeType: 'system',
      mode: systemPref,
      systemLightThemeId: DEFAULT_LIGHT_THEME_ID,
      systemDarkThemeId: DEFAULT_DARK_THEME_ID,
    };
  });

  // Track custom CSS for storage
  const customCSSRef = useRef<string | undefined>(undefined);

  // Memoized theme lists
  const baseThemes = useMemo(() => Object.values(baseThemeRegistry), []);
  const lightThemes = useMemo(
    () => baseThemes.filter(t => t.mode === 'light'),
    [baseThemes]
  );
  const darkThemes = useMemo(
    () => baseThemes.filter(t => t.mode === 'dark'),
    [baseThemes]
  );

  const getBaseTheme = useCallback((id: string): BaseTheme | undefined => {
    return baseThemeRegistry[id];
  }, []);

  // Set a base theme
  const setBaseTheme = useCallback((themeId: string) => {
    const mode = getThemeMode(themeId);
    const themeClass = `theme-${themeId}`;

    // Apply to DOM
    applyThemeClass(themeClass);
    removeCustomCSS();

    // Remove custom theme attribute (used for CSS specificity)
    document.documentElement.removeAttribute('data-custom-theme');

    // Update state using functional update to avoid stale closure
    setState(prev => {
      const newState: ThemeState = {
        ...prev,
        themeId,
        themeType: 'base',
        mode,
      };
      saveToStorage(newState);
      return newState;
    });
    customCSSRef.current = undefined;
  }, []);

  // Set a custom theme
  const setCustomTheme = useCallback((themeId: string, css: string) => {
    console.log(
      '[ThemeProvider] setCustomTheme called at',
      performance.now().toFixed(2) + 'ms'
    );
    console.log('[ThemeProvider] Theme ID:', themeId);
    console.log('[ThemeProvider] CSS starts with:', css.substring(0, 60));

    const themeClass = `theme-custom-${themeId}`;

    // Apply to DOM
    applyThemeClass(themeClass);
    console.log('[ThemeProvider] Applied theme class:', themeClass);

    injectCustomCSS(css);
    console.log('[ThemeProvider] Injected custom CSS');

    // Add custom theme attribute (used for CSS specificity)
    document.documentElement.setAttribute('data-custom-theme', 'true');
    console.log('[ThemeProvider] Set data-custom-theme attribute');

    // Determine mode from the CSS (look for color-scheme)
    const isDark = css.includes('color-scheme: dark');
    const mode: ThemeMode = isDark ? 'dark' : 'light';

    // Update state using functional update to avoid stale closure
    setState(prev => {
      const newState: ThemeState = {
        ...prev,
        themeId,
        themeType: 'custom',
        mode,
      };
      saveToStorage(newState, css);
      return newState;
    });
    customCSSRef.current = css;
  }, []);

  // Set system preference mode
  const setSystemPreference = useCallback(
    (lightThemeId: string, darkThemeId: string) => {
      const systemPref = getSystemPreference();
      const activeThemeId = systemPref === 'dark' ? darkThemeId : lightThemeId;
      const themeClass = `theme-${activeThemeId}`;
      const mode = getThemeMode(activeThemeId);

      // Apply to DOM
      applyThemeClass(themeClass);
      removeCustomCSS();

      // Update state
      const newState: ThemeState = {
        themeId: activeThemeId,
        themeType: 'system',
        mode,
        systemLightThemeId: lightThemeId,
        systemDarkThemeId: darkThemeId,
      };
      setState(newState);
      saveToStorage(newState);
      customCSSRef.current = undefined;
    },
    []
  );

  // Clear custom theme CSS
  const clearCustomThemeCSS = useCallback(() => {
    removeCustomCSS();
    customCSSRef.current = undefined;
  }, []);

  // Legacy API: setThemeById
  const setThemeById = useCallback(
    (themeId: string, isCustom = false) => {
      if (isCustom) {
        // For custom themes, we need the CSS to be applied separately
        // This maintains compatibility with the existing ThemeSync flow
        const themeClass = `theme-${themeId}`;
        applyThemeClass(themeClass);

        // Determine mode - check if we have custom CSS with dark mode
        const existingCSS = customCSSRef.current;
        const isDark = existingCSS?.includes('color-scheme: dark') ?? false;

        setState(prev => {
          const newState: ThemeState = {
            ...prev,
            themeId: themeId.replace('custom-', ''),
            themeType: 'custom',
            mode: isDark ? 'dark' : 'light',
          };
          saveToStorage(newState, customCSSRef.current);
          return newState;
        });
      } else {
        setBaseTheme(themeId);
      }
    },
    [setBaseTheme]
  );

  // Legacy API: applyCustomThemeCSS
  const applyCustomThemeCSS = useCallback((css: string) => {
    injectCustomCSS(css);
    customCSSRef.current = css;
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (state.themeType !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const activeThemeId = e.matches
        ? state.systemDarkThemeId
        : state.systemLightThemeId;
      const themeClass = `theme-${activeThemeId}`;
      const mode = getThemeMode(activeThemeId);

      applyThemeClass(themeClass);
      setState(prev => ({
        ...prev,
        themeId: activeThemeId,
        mode,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.themeType, state.systemLightThemeId, state.systemDarkThemeId]);

  // Build context value
  const value: ThemeContextValue = useMemo(
    () => ({
      state,
      isCustomTheme: state.themeType === 'custom',
      resolvedMode: state.mode,
      currentThemeId: state.themeId,
      baseThemes,
      lightThemes,
      darkThemes,
      getBaseTheme,
      setBaseTheme,
      setCustomTheme,
      setSystemPreference,
      clearCustomThemeCSS,
      // Legacy API
      setThemeById,
      applyCustomThemeCSS,
    }),
    [
      state,
      baseThemes,
      lightThemes,
      darkThemes,
      getBaseTheme,
      setBaseTheme,
      setCustomTheme,
      setSystemPreference,
      clearCustomThemeCSS,
      setThemeById,
      applyCustomThemeCSS,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
