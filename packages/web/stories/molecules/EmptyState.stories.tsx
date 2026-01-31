import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../../components/molecules/empty-state';
import { Button } from '../../components/ui/button';
import {
  Calendar,
  Users,
  MessageSquare,
  Bell,
  Search,
  Inbox,
} from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'No items found.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Calendar className='h-10 w-10' />,
    message: 'No events yet',
    description: 'Create your first event to get started.',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Users className='h-10 w-10' />,
    message: 'No members found',
    description: 'Invite people to join this event.',
    action: <Button>Invite Members</Button>,
  },
};

export const SmallSize: Story = {
  args: {
    icon: <MessageSquare className='h-6 w-6' />,
    message: 'No replies yet',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    icon: <Inbox className='h-12 w-12' />,
    message: 'Your inbox is empty',
    description: "When you receive notifications, they'll appear here.",
    size: 'lg',
  },
};

export const NoNotifications: Story = {
  args: {
    icon: <Bell className='h-10 w-10' />,
    message: 'All caught up!',
    description: "You don't have any new notifications.",
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: <Search className='h-10 w-10' />,
    message: 'No results found',
    description: 'Try adjusting your search or filters.',
    action: <Button variant='outline'>Clear Filters</Button>,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className='flex flex-col gap-8 w-full max-w-md'>
      <div className='border rounded-lg p-4'>
        <div className='text-sm font-medium mb-2'>Small</div>
        <EmptyState
          icon={<MessageSquare className='h-6 w-6' />}
          message='No replies yet'
          size='sm'
        />
      </div>
      <div className='border rounded-lg p-4'>
        <div className='text-sm font-medium mb-2'>Medium (Default)</div>
        <EmptyState
          icon={<Calendar className='h-10 w-10' />}
          message='No events found'
          description='Create an event to get started.'
        />
      </div>
      <div className='border rounded-lg p-4'>
        <div className='text-sm font-medium mb-2'>Large</div>
        <EmptyState
          icon={<Inbox className='h-12 w-12' />}
          message='Your inbox is empty'
          description="When you receive notifications, they'll appear here."
          size='lg'
        />
      </div>
    </div>
  ),
};
