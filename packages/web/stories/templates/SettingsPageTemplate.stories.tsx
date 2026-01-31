import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPageTemplate } from '../../components/templates/settings-page-template';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';

const meta: Meta<typeof SettingsPageTemplate> = {
  title: 'Templates/SettingsPageTemplate',
  component: SettingsPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function SettingsForm() {
  return (
    <div className='space-y-6'>
      <div className='p-4 border rounded-lg space-y-4'>
        <h2 className='font-medium'>Profile Information</h2>
        <div className='grid gap-4'>
          <div>
            <Label htmlFor='name'>Display Name</Label>
            <Input id='name' defaultValue='John Doe' />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' defaultValue='john@example.com' disabled />
          </div>
        </div>
        <Button>Save Changes</Button>
      </div>
      <div className='p-4 border rounded-lg space-y-4'>
        <h2 className='font-medium'>Notifications</h2>
        <p className='text-sm text-muted-foreground'>
          Manage your notification preferences.
        </p>
        <Button variant='outline'>Configure Notifications</Button>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='p-4 border rounded-lg space-y-4'>
        <Skeleton className='h-5 w-32' />
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
        <Skeleton className='h-10 w-28' />
      </div>
    </div>
  );
}

export const Default: Story = {
  args: {
    title: 'Account Settings',
    children: <SettingsForm />,
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Account Settings',
    description: 'Manage your account preferences and profile information',
    children: <SettingsForm />,
  },
};

export const Loading: Story = {
  args: {
    title: 'Account Settings',
    description: 'Manage your account preferences',
    isLoading: true,
    loadingContent: <SettingsSkeleton />,
    children: <SettingsForm />,
  },
};

export const MediumWidth: Story = {
  args: {
    title: 'Settings',
    maxWidth: 'md',
    children: <SettingsForm />,
  },
};
