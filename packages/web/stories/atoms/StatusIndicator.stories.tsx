import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from '@/components/atoms/status-indicator';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Atoms/StatusIndicator',
  component: StatusIndicator,
};
export default meta;
type Story = StoryObj<typeof StatusIndicator>;

export const AllStatuses: Story = {
  render: () => (
    <div className='flex flex-wrap items-center gap-6'>
      {(['online', 'idle', 'dnd', 'invisible', 'offline'] as const).map(
        status => (
          <div key={status} className='flex items-center gap-2'>
            <StatusIndicator status={status} />
            <span>{status}</span>
          </div>
        )
      )}
    </div>
  ),
};
