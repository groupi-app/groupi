import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from '../../components/molecules/loading-state';

const meta: Meta<typeof LoadingState> = {
  title: 'Molecules/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    layout: {
      control: 'select',
      options: ['inline', 'stacked'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithMessage: Story = {
  args: {
    message: 'Loading events...',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    message: 'Loading...',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    message: 'Fetching data...',
  },
};

export const InlineLayout: Story = {
  args: {
    message: 'Loading',
    layout: 'inline',
    size: 'sm',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className='flex flex-col gap-8 w-full max-w-md'>
      <div className='border rounded-lg'>
        <div className='text-sm font-medium p-2 border-b'>Small</div>
        <LoadingState size='sm' message='Loading...' />
      </div>
      <div className='border rounded-lg'>
        <div className='text-sm font-medium p-2 border-b'>Medium (Default)</div>
        <LoadingState message='Loading events...' />
      </div>
      <div className='border rounded-lg'>
        <div className='text-sm font-medium p-2 border-b'>Large</div>
        <LoadingState size='lg' message='Fetching data...' />
      </div>
    </div>
  ),
};

export const Layouts: Story = {
  render: () => (
    <div className='flex flex-col gap-8 w-full max-w-md'>
      <div className='border rounded-lg p-4'>
        <div className='text-sm font-medium mb-2'>Stacked (Default)</div>
        <LoadingState message='Loading...' />
      </div>
      <div className='border rounded-lg p-4'>
        <div className='text-sm font-medium mb-2'>Inline</div>
        <LoadingState message='Loading...' layout='inline' size='sm' />
      </div>
    </div>
  ),
};
