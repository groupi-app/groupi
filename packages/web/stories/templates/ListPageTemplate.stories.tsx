import type { Meta, StoryObj } from '@storybook/react';
import { ListPageTemplate } from '../../components/templates/list-page-template';
import { Button } from '../../components/ui/button';
import { Filter, Plus } from 'lucide-react';

const meta: Meta<typeof ListPageTemplate> = {
  title: 'Templates/ListPageTemplate',
  component: ListPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    headerLayout: {
      control: 'select',
      options: ['row', 'stacked'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function MockListItem({ title }: { title: string }) {
  return (
    <div className='p-4 border rounded-lg hover:bg-accent transition-colors'>
      <h3 className='font-medium'>{title}</h3>
      <p className='text-sm text-muted-foreground'>Event description...</p>
    </div>
  );
}

export const Default: Story = {
  args: {
    title: 'My Events',
    children: (
      <div className='flex flex-col gap-3'>
        <MockListItem title='Team Offsite 2024' />
        <MockListItem title='Product Launch' />
        <MockListItem title='Q1 Planning Meeting' />
      </div>
    ),
  },
};

export const WithControls: Story = {
  args: {
    title: 'My Events',
    controls: (
      <>
        <Button variant='outline' size='sm'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          New Event
        </Button>
      </>
    ),
    children: (
      <div className='flex flex-col gap-3'>
        <MockListItem title='Team Offsite 2024' />
        <MockListItem title='Product Launch' />
        <MockListItem title='Q1 Planning Meeting' />
      </div>
    ),
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Upcoming Events',
    subtitle: 'Events happening in the next 30 days',
    controls: <Button size='sm'>View All</Button>,
    children: (
      <div className='flex flex-col gap-3'>
        <MockListItem title='Team Offsite 2024' />
        <MockListItem title='Product Launch' />
      </div>
    ),
  },
};

export const StackedHeader: Story = {
  args: {
    title: 'All Events',
    subtitle: 'Browse and manage your events',
    headerLayout: 'stacked',
    controls: (
      <>
        <Button variant='outline' size='sm'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          New Event
        </Button>
      </>
    ),
    children: (
      <div className='flex flex-col gap-3'>
        <MockListItem title='Team Offsite 2024' />
        <MockListItem title='Product Launch' />
      </div>
    ),
  },
};

export const NarrowWidth: Story = {
  args: {
    title: 'Notifications',
    maxWidth: 'sm',
    children: (
      <div className='flex flex-col gap-2'>
        <div className='p-3 border rounded-lg text-sm'>
          New comment on your post
        </div>
        <div className='p-3 border rounded-lg text-sm'>Event date changed</div>
      </div>
    ),
  },
};
