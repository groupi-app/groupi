import type { Meta, StoryObj } from '@storybook/react';
import { UserInfoCard } from '../../components/molecules/user-info-card';
import { RoleBadge } from '../../components/molecules/role-badge';

const meta: Meta<typeof UserInfoCard> = {
  title: 'Molecules/UserInfoCard',
  component: UserInfoCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    presence: {
      control: 'select',
      options: [undefined, 'online', 'offline', 'away', 'busy'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    avatar: {
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      fallback: 'JD',
    },
    name: 'John Doe',
    subtitle: '@johndoe',
  },
};

export const WithPresence: Story = {
  args: {
    avatar: {
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      fallback: 'JD',
    },
    name: 'John Doe',
    subtitle: '@johndoe',
    presence: 'online',
  },
};

export const WithBadge: Story = {
  args: {
    avatar: {
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      fallback: 'JD',
    },
    name: 'John Doe',
    subtitle: 'Event Organizer',
    badge: <RoleBadge role='ORGANIZER' size='sm' />,
    presence: 'online',
  },
};

export const FallbackAvatar: Story = {
  args: {
    avatar: {
      fallback: 'AB',
    },
    name: 'Alex Brown',
    subtitle: 'alex@example.com',
  },
};

export const Small: Story = {
  args: {
    avatar: {
      fallback: 'JD',
    },
    name: 'John Doe',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    avatar: {
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      fallback: 'JD',
    },
    name: 'John Doe',
    subtitle: '@johndoe',
    size: 'lg',
    presence: 'online',
  },
};

export const Interactive: Story = {
  args: {
    avatar: {
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      fallback: 'JD',
    },
    name: 'John Doe',
    subtitle: 'Click to view profile',
    onClick: () => alert('Profile clicked!'),
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className='flex flex-col gap-6'>
      <div>
        <div className='text-sm font-medium mb-2'>Small</div>
        <UserInfoCard
          avatar={{ fallback: 'JD' }}
          name='John Doe'
          subtitle='@johndoe'
          size='sm'
          presence='online'
        />
      </div>
      <div>
        <div className='text-sm font-medium mb-2'>Medium (Default)</div>
        <UserInfoCard
          avatar={{ fallback: 'JD' }}
          name='John Doe'
          subtitle='@johndoe'
          size='md'
          presence='online'
        />
      </div>
      <div>
        <div className='text-sm font-medium mb-2'>Large</div>
        <UserInfoCard
          avatar={{ fallback: 'JD' }}
          name='John Doe'
          subtitle='@johndoe'
          size='lg'
          presence='online'
        />
      </div>
    </div>
  ),
};
