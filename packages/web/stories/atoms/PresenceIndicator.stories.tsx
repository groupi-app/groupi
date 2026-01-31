import type { Meta, StoryObj } from '@storybook/react';
import { PresenceIndicator } from '../../components/atoms/presence-indicator';

const meta: Meta<typeof PresenceIndicator> = {
  title: 'Atoms/PresenceIndicator',
  component: PresenceIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'offline', 'away', 'busy'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: {
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
  },
};

export const Away: Story = {
  args: {
    status: 'away',
  },
};

export const Busy: Story = {
  args: {
    status: 'busy',
  },
};

export const OnlineWithPulse: Story = {
  args: {
    status: 'online',
    pulse: true,
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='online' />
        <span className='text-sm'>Online</span>
      </div>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='away' />
        <span className='text-sm'>Away</span>
      </div>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='busy' />
        <span className='text-sm'>Busy</span>
      </div>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='offline' />
        <span className='text-sm'>Offline</span>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='online' size='sm' />
        <span className='text-sm'>Small</span>
      </div>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='online' size='md' />
        <span className='text-sm'>Medium</span>
      </div>
      <div className='flex items-center gap-2'>
        <PresenceIndicator status='online' size='lg' />
        <span className='text-sm'>Large</span>
      </div>
    </div>
  ),
};
