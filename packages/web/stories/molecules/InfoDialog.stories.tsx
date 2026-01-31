import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { InfoDialog } from '../../components/molecules/info-dialog';
import { Button } from '../../components/ui/button';
import { Calendar, Users } from 'lucide-react';

const meta: Meta<typeof InfoDialog> = {
  title: 'Molecules/InfoDialog',
  component: InfoDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for controlled stories
function InfoDialogDemo({
  isLoading = false,
  isEmpty = false,
  ...props
}: Partial<React.ComponentProps<typeof InfoDialog>>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <InfoDialog
        title='Mutual Events'
        description='Events you both are members of'
        open={open}
        onOpenChange={setOpen}
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyMessage='No mutual events found.'
        emptyIcon={<Calendar className='h-10 w-10' />}
        {...props}
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3 border p-2 rounded-md hover:bg-accent'>
            <h3 className='font-medium'>Team Offsite 2024</h3>
            <span className='text-xs text-muted-foreground'>Jan 15</span>
          </div>
          <div className='flex items-center gap-3 border p-2 rounded-md hover:bg-accent'>
            <h3 className='font-medium'>Product Launch Party</h3>
            <span className='text-xs text-muted-foreground'>Feb 20</span>
          </div>
          <div className='flex items-center gap-3 border p-2 rounded-md hover:bg-accent'>
            <h3 className='font-medium'>Q1 Planning</h3>
            <span className='text-xs text-muted-foreground'>Mar 5</span>
          </div>
        </div>
      </InfoDialog>
    </>
  );
}

function MembersListDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>View Members</Button>
      <InfoDialog
        title='Event Members'
        description='People attending this event'
        open={open}
        onOpenChange={setOpen}
        isEmpty={false}
        emptyMessage='No members yet.'
        emptyIcon={<Users className='h-10 w-10' />}
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3 p-2 rounded-md'>
            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
              JD
            </div>
            <div>
              <div className='font-medium'>John Doe</div>
              <div className='text-xs text-muted-foreground'>Organizer</div>
            </div>
          </div>
          <div className='flex items-center gap-3 p-2 rounded-md'>
            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
              JS
            </div>
            <div>
              <div className='font-medium'>Jane Smith</div>
              <div className='text-xs text-muted-foreground'>Attendee</div>
            </div>
          </div>
        </div>
      </InfoDialog>
    </>
  );
}

function CustomCloseTextDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <InfoDialog
        title='Event Details'
        description='Information about the event'
        open={open}
        onOpenChange={setOpen}
        closeText='Done'
      >
        <div className='space-y-2 text-sm'>
          <p>
            <strong>Date:</strong> January 15, 2024
          </p>
          <p>
            <strong>Location:</strong> Conference Room A
          </p>
          <p>
            <strong>Duration:</strong> 2 hours
          </p>
        </div>
      </InfoDialog>
    </>
  );
}

export const WithContent: Story = {
  render: () => <InfoDialogDemo />,
};

export const Loading: Story = {
  render: () => <InfoDialogDemo isLoading loadingMessage='Loading events...' />,
};

export const Empty: Story = {
  render: () => <InfoDialogDemo isEmpty />,
};

export const MembersList: Story = {
  render: () => <MembersListDemo />,
};

export const CustomCloseText: Story = {
  render: () => <CustomCloseTextDemo />,
};
