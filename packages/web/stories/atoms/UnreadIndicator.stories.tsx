import type { Meta, StoryObj } from '@storybook/react';
import { UnreadIndicator } from '../../components/atoms/unread-indicator';

const meta: Meta<typeof UnreadIndicator> = {
  title: 'Atoms/UnreadIndicator',
  component: UnreadIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
    },
    showDot: {
      control: 'boolean',
    },
    max: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dot: Story = {
  args: {
    showDot: true,
  },
};

export const SmallCount: Story = {
  args: {
    count: 5,
  },
};

export const LargeCount: Story = {
  args: {
    count: 42,
  },
};

export const OverflowCount: Story = {
  args: {
    count: 150,
    max: 99,
  },
};

export const CustomMax: Story = {
  args: {
    count: 12,
    max: 9,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex items-center gap-6'>
      <div className='flex flex-col items-center gap-1'>
        <UnreadIndicator showDot />
        <span className='text-xs text-muted-foreground'>Dot</span>
      </div>
      <div className='flex flex-col items-center gap-1'>
        <UnreadIndicator count={3} />
        <span className='text-xs text-muted-foreground'>Count: 3</span>
      </div>
      <div className='flex flex-col items-center gap-1'>
        <UnreadIndicator count={42} />
        <span className='text-xs text-muted-foreground'>Count: 42</span>
      </div>
      <div className='flex flex-col items-center gap-1'>
        <UnreadIndicator count={150} max={99} />
        <span className='text-xs text-muted-foreground'>Count: 150+</span>
      </div>
    </div>
  ),
};
