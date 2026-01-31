import type { Meta, StoryObj } from '@storybook/react';
import { RoleBadge } from '../../components/molecules/role-badge';

const meta: Meta<typeof RoleBadge> = {
  title: 'Molecules/RoleBadge',
  component: RoleBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    role: {
      control: 'select',
      options: ['ORGANIZER', 'MODERATOR', 'ATTENDEE'],
    },
    variant: {
      control: 'select',
      options: ['full', 'abbreviated', 'icon'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Organizer: Story = {
  args: {
    role: 'ORGANIZER',
  },
};

export const Moderator: Story = {
  args: {
    role: 'MODERATOR',
  },
};

export const Attendee: Story = {
  args: {
    role: 'ATTENDEE',
  },
};

export const Abbreviated: Story = {
  args: {
    role: 'ORGANIZER',
    variant: 'abbreviated',
  },
};

export const IconOnly: Story = {
  args: {
    role: 'ORGANIZER',
    variant: 'icon',
  },
};

export const AllRoles: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Full:</span>
        <RoleBadge role='ORGANIZER' variant='full' />
        <RoleBadge role='MODERATOR' variant='full' />
        <RoleBadge role='ATTENDEE' variant='full' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Abbrev:</span>
        <RoleBadge role='ORGANIZER' variant='abbreviated' />
        <RoleBadge role='MODERATOR' variant='abbreviated' />
        <RoleBadge role='ATTENDEE' variant='abbreviated' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Icon:</span>
        <RoleBadge role='ORGANIZER' variant='icon' />
        <RoleBadge role='MODERATOR' variant='icon' />
        <RoleBadge role='ATTENDEE' variant='icon' />
      </div>
    </div>
  ),
};
