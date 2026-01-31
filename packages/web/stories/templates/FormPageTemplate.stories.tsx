import type { Meta, StoryObj } from '@storybook/react';
import { FormPageTemplate } from '../../components/templates/form-page-template';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Skeleton } from '../../components/ui/skeleton';

const meta: Meta<typeof FormPageTemplate> = {
  title: 'Templates/FormPageTemplate',
  component: FormPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function MockForm() {
  return (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='title'>Event Title</Label>
        <Input id='title' placeholder='Enter event title' />
      </div>
      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' placeholder='Describe your event' rows={4} />
      </div>
      <div className='flex gap-2 justify-end pt-4'>
        <Button variant='ghost'>Cancel</Button>
        <Button>Save Event</Button>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-10 w-full' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-24 w-full' />
      </div>
      <div className='flex gap-2 justify-end pt-4'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}

export const Default: Story = {
  args: {
    title: 'Create Event',
    backHref: '/events',
    children: <MockForm />,
  },
};

export const WithoutTitle: Story = {
  args: {
    backHref: '/events',
    children: <MockForm />,
  },
};

export const WithoutBackButton: Story = {
  args: {
    title: 'Edit Profile',
    children: <MockForm />,
  },
};

export const NarrowWidth: Story = {
  args: {
    title: 'Quick Settings',
    maxWidth: 'sm',
    children: <MockForm />,
  },
};

export const WideWidth: Story = {
  args: {
    title: 'Event Details',
    maxWidth: 'lg',
    children: <MockForm />,
  },
};

export const CustomBackLabel: Story = {
  args: {
    title: 'Edit Post',
    backHref: '/event/123',
    backLabel: 'Back to Event',
    children: <MockForm />,
  },
};

export const WithSkeleton: Story = {
  args: {
    title: 'Edit Event',
    backHref: '/events',
    skeleton: <FormSkeleton />,
    children: <MockForm />,
  },
};
