import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmationDialog } from '../../components/molecules/confirmation-dialog';
import { Dialog, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Trash2, UserMinus, AlertTriangle } from 'lucide-react';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'Molecules/ConfirmationDialog',
  component: ConfirmationDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDestructive: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
  },
  decorators: [
    Story => (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <Story />
      </Dialog>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DeletePost: Story = {
  args: {
    title: 'Delete Post?',
    description:
      'Are you sure you want to delete this post? This action cannot be undone.',
    confirmText: 'Delete',
    onConfirm: () => console.log('Delete confirmed'),
  },
};

export const KickMember: Story = {
  args: {
    title: 'Kick Attendee?',
    description:
      'Are you sure you want to kick this attendee? They will need to be invited again to rejoin.',
    confirmText: 'Kick',
    onConfirm: () => console.log('Kick confirmed'),
  },
};

export const PromoteMember: Story = {
  args: {
    title: 'Promote Attendee?',
    description:
      'Are you sure you want to promote this attendee? They will be able to delete posts and kick/ban attendees.',
    confirmText: 'Promote',
    isDestructive: false,
    onConfirm: () => console.log('Promote confirmed'),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Remove from Event?',
    description: 'This action will remove the user from all event activities.',
    confirmText: 'Remove',
    icon: <UserMinus className='h-12 w-12 text-destructive' />,
    onConfirm: () => console.log('Remove confirmed'),
  },
};

export const Loading: Story = {
  args: {
    title: 'Delete Post?',
    description: 'Are you sure you want to delete this post?',
    confirmText: 'Delete',
    isLoading: true,
    loadingText: 'Deleting...',
    onConfirm: () => console.log('Delete confirmed'),
  },
};

export const CustomButtonVariant: Story = {
  args: {
    title: 'Leave Event?',
    description:
      'You are about to leave this event. You can rejoin if invited again.',
    confirmText: 'Leave Event',
    cancelText: 'Stay',
    confirmVariant: 'outline',
    isDestructive: false,
    onConfirm: () => console.log('Leave confirmed'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-col gap-4 p-4'>
      <div className='text-sm font-medium'>
        Click the buttons to see different dialog variations:
      </div>
      <div className='flex flex-wrap gap-2'>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='destructive' size='sm'>
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </Button>
          </DialogTrigger>
          <ConfirmationDialog
            title='Delete Post?'
            description='This action cannot be undone.'
            confirmText='Delete'
            onConfirm={() => console.log('Deleted')}
          />
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline' size='sm'>
              <UserMinus className='h-4 w-4 mr-2' />
              Kick
            </Button>
          </DialogTrigger>
          <ConfirmationDialog
            title='Kick Attendee?'
            description='They will need to be invited again.'
            confirmText='Kick'
            onConfirm={() => console.log('Kicked')}
          />
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button size='sm'>
              <AlertTriangle className='h-4 w-4 mr-2' />
              Promote
            </Button>
          </DialogTrigger>
          <ConfirmationDialog
            title='Promote Attendee?'
            description='They will gain moderator privileges.'
            confirmText='Promote'
            isDestructive={false}
            onConfirm={() => console.log('Promoted')}
          />
        </Dialog>
      </div>
    </div>
  ),
};
