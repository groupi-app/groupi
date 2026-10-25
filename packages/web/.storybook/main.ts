import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  // Component fixtures import the app's dormant Convex singleton through auth
  // helpers. Give Storybook a placeholder address; fixtures provide their own
  // local transport and must never inherit a real application deployment.
  env: config => ({
    ...config,
    NEXT_PUBLIC_CONVEX_URL: 'https://fixture.convex.cloud',
  }),
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: [
    '../public',
    { from: '../../../assets/fonts', to: '/assets/fonts' },
  ],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
