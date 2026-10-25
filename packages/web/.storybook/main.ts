import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
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
