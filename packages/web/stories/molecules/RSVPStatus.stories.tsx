import type { Meta, StoryObj } from '@storybook/react';
import { RSVPStatus } from '../../components/molecules/rsvp-status';

const meta: Meta<typeof RSVPStatus> = {
  title: 'Molecules/RSVPStatus',
  component: RSVPStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['YES', 'NO', 'MAYBE', 'PENDING'],
    },
    variant: {
      control: 'select',
      options: ['badge', 'icon', 'text', 'icon-text'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Going: Story = {
  args: {
    status: 'YES',
  },
};

export const NotGoing: Story = {
  args: {
    status: 'NO',
  },
};

export const Maybe: Story = {
  args: {
    status: 'MAYBE',
  },
};

export const Pending: Story = {
  args: {
    status: 'PENDING',
  },
};

export const IconVariant: Story = {
  args: {
    status: 'YES',
    variant: 'icon',
  },
};

export const TextVariant: Story = {
  args: {
    status: 'YES',
    variant: 'text',
  },
};

export const IconTextVariant: Story = {
  args: {
    status: 'YES',
    variant: 'icon-text',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Badge:</span>
        <RSVPStatus status='YES' variant='badge' />
        <RSVPStatus status='NO' variant='badge' />
        <RSVPStatus status='MAYBE' variant='badge' />
        <RSVPStatus status='PENDING' variant='badge' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Icon:</span>
        <RSVPStatus status='YES' variant='icon' />
        <RSVPStatus status='NO' variant='icon' />
        <RSVPStatus status='MAYBE' variant='icon' />
        <RSVPStatus status='PENDING' variant='icon' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Text:</span>
        <RSVPStatus status='YES' variant='text' />
        <RSVPStatus status='NO' variant='text' />
        <RSVPStatus status='MAYBE' variant='text' />
        <RSVPStatus status='PENDING' variant='text' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm w-20'>Icon+Text:</span>
        <RSVPStatus status='YES' variant='icon-text' />
        <RSVPStatus status='NO' variant='icon-text' />
        <RSVPStatus status='MAYBE' variant='icon-text' />
        <RSVPStatus status='PENDING' variant='icon-text' />
      </div>
    </div>
  ),
};
