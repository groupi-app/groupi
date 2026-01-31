import type { Meta, StoryObj } from '@storybook/react';
import { DetailPageTemplate } from '../../components/templates/detail-page-template';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

const meta: Meta<typeof DetailPageTemplate> = {
  title: 'Templates/DetailPageTemplate',
  component: DetailPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function MockHeader() {
  return (
    <div className='bg-gradient-to-r from-primary/20 to-primary/5 p-6 rounded-lg'>
      <h1 className='text-3xl font-heading font-bold'>Team Offsite 2024</h1>
      <p className='text-muted-foreground mt-2'>March 15-17, Lake Tahoe</p>
    </div>
  );
}

function MockPost({ title }: { title: string }) {
  return (
    <div className='p-4 border rounded-lg'>
      <h3 className='font-medium'>{title}</h3>
      <p className='text-sm text-muted-foreground mt-2'>
        Post content goes here...
      </p>
    </div>
  );
}

function FloatingButton() {
  return (
    <Button className='fixed bottom-6 right-6 rounded-full shadow-lg' size='lg'>
      <Plus className='h-5 w-5 mr-2' />
      New Post
    </Button>
  );
}

export const Default: Story = {
  args: {
    header: <MockHeader />,
    children: (
      <>
        <MockPost title='Packing List' />
        <MockPost title='Travel Arrangements' />
        <MockPost title='Activity Schedule' />
      </>
    ),
  },
};

export const WithFloatingAction: Story = {
  args: {
    header: <MockHeader />,
    floatingAction: <FloatingButton />,
    children: (
      <>
        <MockPost title='Packing List' />
        <MockPost title='Travel Arrangements' />
      </>
    ),
  },
};

export const NoHeader: Story = {
  args: {
    children: (
      <>
        <MockPost title='Post 1' />
        <MockPost title='Post 2' />
        <MockPost title='Post 3' />
      </>
    ),
  },
};

export const LargeSpacing: Story = {
  args: {
    header: <MockHeader />,
    spacing: 'lg',
    children: (
      <>
        <MockPost title='Section 1' />
        <MockPost title='Section 2' />
      </>
    ),
  },
};

export const NarrowContent: Story = {
  args: {
    header: <MockHeader />,
    maxWidth: 'sm',
    children: (
      <>
        <MockPost title='Focused Content' />
      </>
    ),
  },
};
