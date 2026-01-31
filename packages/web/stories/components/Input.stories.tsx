import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Search, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
};

export const Email: Story = {
  args: {
    placeholder: 'email@example.com',
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    placeholder: 'Enter password',
    type: 'password',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className='space-y-2 w-[300px]'>
      <Label htmlFor='email-input'>Email</Label>
      <Input id='email-input' type='email' placeholder='email@example.com' />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className='relative w-[300px]'>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input className='pl-9' placeholder='Search events...' />
    </div>
  ),
};

export const PasswordToggle: Story = {
  render: function PasswordToggleStory() {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className='relative w-[300px]'>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder='Enter password'
          className='pr-10'
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          {showPassword ? (
            <EyeOff className='h-4 w-4' />
          ) : (
            <Eye className='h-4 w-4' />
          )}
        </button>
      </div>
    );
  },
};

export const WithButton: Story = {
  render: () => (
    <div className='flex w-[400px] gap-2'>
      <Input type='email' placeholder='Enter your email' />
      <Button>
        <Mail className='mr-2 h-4 w-4' />
        Subscribe
      </Button>
    </div>
  ),
};

export const File: Story = {
  args: {
    type: 'file',
    className: 'cursor-pointer',
  },
};
