import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Save } from 'lucide-react';
import { Heading } from '@/components/atoms/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardActions,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const meta = {
  title: 'Design system/Application defaults',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ApplicationDefaults() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 25));
  return (
    <main className='mx-auto max-w-4xl space-y-8 p-4 sm:p-8'>
      <header className='space-y-2'>
        <Heading level={1} roleSize='page'>
          Everyday event planning
        </Heading>
        <p className='text-muted-foreground'>
          Canonical components using their application defaults.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sunday board games</CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          <Badge>Planning</Badge>
          <div className='space-y-2'>
            <Label htmlFor='default-event-name'>Event name</Label>
            <Input id='default-event-name' defaultValue='Sunday board games' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='default-visibility'>Who can join?</Label>
            <Select defaultValue='group'>
              <SelectTrigger id='default-visibility'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='group'>Group members</SelectItem>
                <SelectItem value='invite'>Invited people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Button>
              <Save aria-hidden='true' />
              Save changes
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline'>Choose date</Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-2'>
                <Calendar
                  mode='single'
                  selected={date}
                  onSelect={setDate}
                  defaultMonth={new Date(2026, 9, 1)}
                />
              </PopoverContent>
            </Popover>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline'>Event details</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sunday board games</SheetTitle>
                  <SheetDescription>
                    Bring a game to share. We’ll choose the final time together.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue='details'>
        <TabsList aria-label='Event sections'>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='people'>People</TabsTrigger>
        </TabsList>
        <TabsContent value='details' className='space-y-5'>
          <Alert>
            <AlertDescription>
              You can change the date until voting closes.
            </AlertDescription>
          </Alert>
          <div className='space-y-3'>
            <Label id='reminder-label'>Reminder lead time</Label>
            <Slider
              aria-labelledby='reminder-label'
              defaultValue={[24]}
              max={48}
              step={1}
            />
          </div>
        </TabsContent>
        <TabsContent value='people'>
          Invitations will appear here once you send them.
        </TabsContent>
      </Tabs>
      <section className='space-y-4'>
        <Heading level={2}>Response actions</Heading>
        <div className='flex flex-wrap gap-3'>
          <Button variant='success'>Going</Button>
          <Button variant='warning'>Maybe</Button>
          <Button variant='info'>Awaiting response</Button>
          <Button variant='destructive-ghost'>Leave event</Button>
          <Button variant='link'>View all responses</Button>
        </div>
        <div className='rounded-card bg-primary p-4'>
          <Button variant='outline-primary'>Create another event</Button>
        </div>
      </section>
      <Card treatment='interactive'>
        <CardHeader>
          <CardTitle>
            <CardAction disabled>Template unavailable</CardAction>
          </CardTitle>
        </CardHeader>
        <CardContent>
          This template is being updated. You can still review its details.
        </CardContent>
        <CardActions className='px-6 pb-6'>
          <Button variant='outline'>Review template</Button>
        </CardActions>
      </Card>
    </main>
  );
}

export const EverydayPlanning: Story = {
  render: () => <ApplicationDefaults />,
};
