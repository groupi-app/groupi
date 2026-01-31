import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '../../components/ui/progress';
import { useEffect, useState } from 'react';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    className: 'w-[300px]',
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    className: 'w-[300px]',
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    className: 'w-[300px]',
  },
};

export const Animated: Story = {
  render: function AnimatedProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 5;
        });
      }, 200);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className='w-[300px] space-y-2'>
        <Progress value={progress} />
        <p className='text-center text-sm text-muted-foreground'>
          {progress}% complete
        </p>
      </div>
    );
  },
};

export const EventCapacity: Story = {
  render: () => (
    <div className='w-[300px] space-y-2'>
      <div className='flex justify-between text-sm'>
        <span>Event capacity</span>
        <span>18/25 attendees</span>
      </div>
      <Progress value={72} />
      <p className='text-xs text-muted-foreground'>7 spots remaining</p>
    </div>
  ),
};

export const MultipleProgress: Story = {
  render: () => (
    <div className='w-[400px] space-y-4'>
      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <span>Step 1: Create event</span>
          <span>Complete</span>
        </div>
        <Progress value={100} />
      </div>
      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <span>Step 2: Add details</span>
          <span>In progress</span>
        </div>
        <Progress value={60} />
      </div>
      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <span>Step 3: Invite members</span>
          <span>Not started</span>
        </div>
        <Progress value={0} />
      </div>
    </div>
  ),
};
