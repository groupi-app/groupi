import type { Meta, StoryObj } from '@storybook/react';
import { TimestampBadge } from '../../components/molecules/timestamp-badge';

const meta: Meta<typeof TimestampBadge> = {
  title: 'Molecules/TimestampBadge',
  component: TimestampBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    formatStyle: {
      control: 'select',
      options: ['relative', 'absolute', 'smart'],
    },
    prefix: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

export const JustNow: Story = {
  args: {
    date: fiveMinutesAgo,
    formatStyle: 'relative',
  },
};

export const HoursAgo: Story = {
  args: {
    date: twoHoursAgo,
    formatStyle: 'relative',
  },
};

export const AbsoluteFormat: Story = {
  args: {
    date: lastWeek,
    formatStyle: 'absolute',
  },
};

export const SmartFormat: Story = {
  args: {
    date: yesterday,
    formatStyle: 'smart',
  },
};

export const WithPrefix: Story = {
  args: {
    date: twoHoursAgo,
    prefix: 'Posted',
  },
};

export const AllFormats: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='text-sm font-medium'>Just now (5 min ago)</div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Relative:</span>
        <TimestampBadge date={fiveMinutesAgo} formatStyle='relative' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Absolute:</span>
        <TimestampBadge date={fiveMinutesAgo} formatStyle='absolute' />
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Smart:</span>
        <TimestampBadge date={fiveMinutesAgo} formatStyle='smart' />
      </div>

      <div className='text-sm font-medium mt-4'>Yesterday</div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Smart:</span>
        <TimestampBadge date={yesterday} formatStyle='smart' />
      </div>

      <div className='text-sm font-medium mt-4'>Last Week</div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Smart:</span>
        <TimestampBadge date={lastWeek} formatStyle='smart' />
      </div>

      <div className='text-sm font-medium mt-4'>Last Year</div>
      <div className='flex items-center gap-4'>
        <span className='text-xs w-16'>Smart:</span>
        <TimestampBadge date={lastYear} formatStyle='smart' />
      </div>
    </div>
  ),
};
