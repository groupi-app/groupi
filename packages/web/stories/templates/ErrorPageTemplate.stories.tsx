import type { Meta, StoryObj } from '@storybook/react';
import {
  ErrorPageTemplate,
  parseError,
} from '../../components/templates/error-page-template';
import { AlertTriangle, WifiOff, Lock } from 'lucide-react';

const meta: Meta<typeof ErrorPageTemplate> = {
  title: 'Templates/ErrorPageTemplate',
  component: ErrorPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    showRetry: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: new Error('Something went wrong'),
    reset: () => console.log('Retry clicked'),
  },
};

export const NotFound: Story = {
  args: {
    error: new Error('Event not found'),
    context: 'event',
    reset: () => console.log('Retry clicked'),
  },
};

export const Unauthorized: Story = {
  args: {
    error: new Error('unauthorized access'),
    reset: () => console.log('Retry clicked'),
  },
};

export const NetworkError: Story = {
  args: {
    error: new Error('Network request failed'),
    reset: () => console.log('Retry clicked'),
    icon: <WifiOff className='h-16 w-16 text-muted-foreground' />,
  },
};

export const CustomContent: Story = {
  args: {
    error: new Error('Custom error'),
    title: 'Page Temporarily Unavailable',
    message:
      'We are performing maintenance. Please try again in a few minutes.',
    icon: <AlertTriangle className='h-16 w-16 text-warning' />,
    reset: () => console.log('Retry clicked'),
  },
};

export const NoRetry: Story = {
  args: {
    error: new Error('Access denied'),
    showRetry: false,
    icon: <Lock className='h-16 w-16 text-destructive' />,
  },
};

export const WithContext: Story = {
  args: {
    error: new Error('Failed to load post data'),
    context: 'post',
    reset: () => console.log('Retry clicked'),
  },
};

export const ParseErrorFunction: Story = {
  render: () => {
    const errors = [
      { error: new Error('not found'), context: 'event' },
      { error: new Error('unauthorized'), context: undefined },
      { error: new Error('network error'), context: undefined },
      { error: new Error('random error'), context: undefined },
    ];

    return (
      <div className='container py-8 space-y-6'>
        <h2 className='text-lg font-medium'>parseError() Function Results</h2>
        {errors.map(({ error, context }, i) => {
          const parsed = parseError(error, context);
          return (
            <div key={i} className='p-4 border rounded-lg'>
              <p className='text-sm text-muted-foreground'>
                Input: &quot;{error.message}&quot;
                {context && ` (context: ${context})`}
              </p>
              <p className='font-medium mt-2'>{parsed.title}</p>
              <p className='text-sm text-muted-foreground'>{parsed.message}</p>
              <p className='text-xs mt-2'>
                Recoverable: {parsed.recoverable ? 'Yes' : 'No'}
              </p>
            </div>
          );
        })}
      </div>
    );
  },
};
