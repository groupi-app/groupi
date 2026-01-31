import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
} from 'lucide-react';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className='w-[450px]'>
      <Terminal className='h-4 w-4' />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant='destructive' className='w-[450px]'>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant='success' className='w-[450px]'>
      <CheckCircle2 className='h-4 w-4' />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your event has been created successfully!
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant='warning' className='w-[450px]'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This event is almost at capacity. Only 3 spots remaining.
      </AlertDescription>
    </Alert>
  ),
};

export const InfoAlert: Story = {
  render: () => (
    <Alert variant='info' className='w-[450px]'>
      <Info className='h-4 w-4' />
      <AlertTitle>Info</AlertTitle>
      <AlertDescription>
        The event organizer has updated the meeting location.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-col gap-4 w-[450px]'>
      <Alert>
        <Terminal className='h-4 w-4' />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A default alert message.</AlertDescription>
      </Alert>
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>An error or destructive message.</AlertDescription>
      </Alert>
      <Alert variant='success'>
        <CheckCircle2 className='h-4 w-4' />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>A success message.</AlertDescription>
      </Alert>
      <Alert variant='warning'>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>A warning message.</AlertDescription>
      </Alert>
      <Alert variant='info'>
        <Info className='h-4 w-4' />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>An informational message.</AlertDescription>
      </Alert>
    </div>
  ),
};
