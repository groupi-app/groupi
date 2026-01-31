import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with the rounded design system styling.</p>
      </CardContent>
      <CardFooter>
        <Button className='w-full'>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const LoginForm: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' placeholder='m@example.com' type='email' />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <Input id='password' type='password' />
        </div>
      </CardContent>
      <CardFooter>
        <Button className='w-full'>Sign In</Button>
      </CardFooter>
    </Card>
  ),
};

export const EventCard: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Team Meetup 🎉</CardTitle>
        <CardDescription>Friday, March 15 at 6:00 PM</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 text-sm'>
          <p>📍 Downtown Coffee Shop</p>
          <p>👥 12 attendees</p>
        </div>
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Button variant='outline' className='flex-1'>
          Maybe
        </Button>
        <Button className='flex-1'>Join</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className='w-[300px] p-6'>
      <p className='text-center text-muted-foreground'>
        A simple card with just content, no header or footer.
      </p>
    </Card>
  ),
};
