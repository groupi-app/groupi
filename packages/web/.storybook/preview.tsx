import type { Preview } from '@storybook/react';
import React from 'react';
import '../styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      // Apply dark mode class based on background
      const isDark = context.globals.backgrounds?.value === '#0a0a0a';
      return (
        <div className={isDark ? 'dark' : ''}>
          <div className='bg-background text-foreground p-4'>
            <Story />
          </div>
        </div>
      );
    },
  ],
  tags: ['autodocs'],
};

export default preview;
