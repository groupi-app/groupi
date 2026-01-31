import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../../components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'success',
        'warning',
        'info',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='default'>Default</Badge>
      <Badge variant='secondary'>Secondary</Badge>
      <Badge variant='destructive'>Destructive</Badge>
      <Badge variant='outline'>Outline</Badge>
      <Badge variant='success'>Success</Badge>
      <Badge variant='warning'>Warning</Badge>
      <Badge variant='info'>Info</Badge>
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <Badge variant='success'>RSVP: Yes</Badge>
        <span className='text-sm text-muted-foreground'>
          You&apos;re going to this event
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <Badge variant='warning'>RSVP: Maybe</Badge>
        <span className='text-sm text-muted-foreground'>You might attend</span>
      </div>
      <div className='flex items-center gap-2'>
        <Badge variant='destructive'>RSVP: No</Badge>
        <span className='text-sm text-muted-foreground'>
          You&apos;re not attending
        </span>
      </div>
    </div>
  ),
};
