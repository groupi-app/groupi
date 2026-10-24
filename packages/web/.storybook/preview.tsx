import type { Preview } from '@storybook/react';
import { useLayoutEffect, type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import {
  baseThemes,
  type ThemeTokenOverrides,
} from '@groupi/shared/design/themes';
import { ThemeProvider, useGroupiTheme } from '../providers/theme-provider';
import { generateCompleteCustomThemeCSS } from '../lib/theme-css';
import '../styles/globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-sans' });
const headingFont = localFont({
  src: '../../../assets/fonts/Geologica.woff2',
  variable: '--font-heading',
});

const customExamples: Record<
  string,
  { base: string; name: string; overrides: ThemeTokenOverrides }
> = {
  'custom-pastel': {
    base: 'groupi-light',
    name: 'Custom · pale fills',
    overrides: {
      brand: { primary: '#f4d7ff', secondary: '#ffd25e', accent: '#d4f5e8' },
    },
  },
  'custom-alpha': {
    base: 'groupi-light',
    name: 'Custom · translucent fill',
    overrides: {
      brand: {
        primary: 'rgba(130, 0, 173, 0.35)',
        secondary: 'rgba(0, 100, 150, 0.25)',
      },
    },
  },
  'custom-dark': {
    base: 'groupi-dark',
    name: 'Custom · near-dark fill',
    overrides: { brand: { primary: '#21172e', secondary: '#2c223c' } },
  },
};

/** Uses the production provider and production custom-theme serializer, including
 * document-root classes so portaled menus and dialogs receive exactly the same theme. */
function PreviewTheme({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  const { setBaseTheme, setCustomTheme } = useGroupiTheme();
  useLayoutEffect(() => {
    document.documentElement.classList.add(
      bodyFont.variable,
      headingFont.variable
    );
    const custom = customExamples[themeId];
    if (custom) {
      const base = baseThemes.find(theme => theme.id === custom.base)!;
      setCustomTheme(
        'storybook',
        generateCompleteCustomThemeCSS('storybook', base, custom.overrides)
      );
    } else {
      setBaseTheme(themeId);
    }
  }, [themeId, setBaseTheme, setCustomTheme]);
  return (
    <div className='min-h-screen bg-background font-sans text-foreground antialiased'>
      {children}
    </div>
  );
}

const preview: Preview = {
  initialGlobals: { theme: 'groupi-light' },
  globalTypes: {
    theme: {
      description: 'Actual Groupi theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          ...baseThemes.map(theme => ({ value: theme.id, title: theme.name })),
          ...Object.entries(customExamples).map(([value, example]) => ({
            value,
            title: example.name,
          })),
        ],
      },
    },
  },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider>
        <PreviewTheme themeId={context.globals.theme ?? 'groupi-light'}>
          <Story />
        </PreviewTheme>
      </ThemeProvider>
    ),
  ],
  tags: ['autodocs'],
};
export default preview;
