import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Globe,
  MoreHorizontal,
  Plus,
  Users,
} from 'lucide-react';
import { Heading } from '@/components/atoms/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardActions,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/molecules/empty-state';
import { LoadingState } from '@/components/molecules/loading-state';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { ListPageTemplate } from '@/components/templates/list-page-template';
import { Toaster } from '@/components/ui/sonner';
import { toast } from '@/lib/utils/toast';

const meta = {
  title: 'Design system/Soft lift',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='flex min-w-0 flex-col gap-5'>
      <div className='flex flex-col gap-1'>
        <Heading>{title}</Heading>
        {description && (
          <p className='max-w-2xl text-muted-foreground'>{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
function GalleryFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className='mx-auto flex max-w-6xl flex-col gap-12 px-5 py-8 sm:px-8 sm:py-12'>
      {children}
    </main>
  );
}
function Actions() {
  return (
    <Section
      title='Actions with a little give'
      description='Hover a filled action, then hold to press it farther. Tab through to inspect focus.'
    >
      <div className='flex flex-wrap items-start gap-5'>
        <Button presentation='soft' icon={<Plus aria-hidden='true' />}>
          Create event
        </Button>
        <Button presentation='soft' variant='secondary'>
          Save draft
        </Button>
        <Button presentation='soft' variant='destructive'>
          Remove
        </Button>
        <Button presentation='soft' variant='outline'>
          Edit details
        </Button>
        <Button presentation='soft' variant='ghost'>
          Cancel
        </Button>
        <Button presentation='soft' variant='link'>
          See all events
        </Button>
      </div>
      <div className='flex flex-wrap items-center gap-5'>
        <Button presentation='soft' isLoading loadingText='Saving changes'>
          Save changes
        </Button>
        <Button presentation='soft' disabled>
          Create event
        </Button>
        <Button presentation='soft' asChild>
          <a href='#surfaces'>
            Explore surfaces <ArrowRight aria-hidden='true' />
          </a>
        </Button>
        <Button presentation='soft' size='icon' aria-label='Add a date'>
          <Plus aria-hidden='true' />
        </Button>
      </div>
    </Section>
  );
}
function SurfaceSamples() {
  const [saved, setSaved] = useState(false);
  const [opened, setOpened] = useState(false);
  return (
    <Section
      title='Surfaces tell you what they do'
      description='Information stays still. A featured surface draws attention. A destination responds to its primary action.'
    >
      <div id='surfaces' className='grid items-start gap-6 md:grid-cols-3'>
        <Card treatment='quiet'>
          <CardHeader>
            <Badge presentation='soft' variant='outline'>
              Information
            </Badge>
            <CardTitle>Bring something to share</CardTitle>
            <CardDescription>
              Snacks, a blanket, and your favorite people.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>
              Quiet surfaces keep everyday details easy to scan.
            </p>
          </CardContent>
        </Card>
        <Card treatment='featured'>
          <CardHeader>
            <Badge presentation='soft' variant='info'>
              <CalendarDays aria-hidden='true' className='size-3' /> Up next
            </Badge>
            <CardTitle>Picnic in the park</CardTitle>
            <CardDescription>Saturday · 2:00 PM</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>
              A static frame gives this moment emphasis.
            </p>
          </CardContent>
          <CardFooter>
            <Button presentation='soft' variant='outline'>
              View details
            </Button>
          </CardFooter>
        </Card>
        <Card treatment='interactive'>
          <CardHeader>
            <Badge presentation='soft' variant='success'>
              <Globe aria-hidden='true' className='size-3' /> Public event
            </Badge>
            <CardTitle>
              <CardAction onClick={() => setOpened(true)}>
                Sunday board games{' '}
                <ArrowRight aria-hidden='true' className='inline size-4' />
              </CardAction>
            </CardTitle>
            <CardDescription>Sunday · 4:00 PM</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>
              Open from the card. Save it independently.
            </p>
          </CardContent>
          <CardFooter>
            <CardActions>
              <Button
                presentation='soft'
                variant='outline'
                aria-pressed={saved}
                onClick={() => setSaved(!saved)}
              >
                {saved ? 'Saved' : 'Save event'}
              </Button>
            </CardActions>
          </CardFooter>
        </Card>
      </div>
      <p role='status' className='text-sm text-muted-foreground'>
        {opened
          ? 'Sunday board games opened. This gallery uses local sample content.'
          : 'Try the primary card action and the separate Save event button.'}
      </p>
    </Section>
  );
}
function Fields() {
  const [mixed, setMixed] = useState<boolean | 'indeterminate'>(
    'indeterminate'
  );
  return (
    <Section title='Quiet controls, clear states'>
      <div className='grid gap-8 md:grid-cols-2'>
        <div className='flex min-w-0 flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='event-name'>Event name</Label>
            <Input
              presentation='soft'
              id='event-name'
              placeholder='What are we planning?'
            />
            <p className='text-sm text-muted-foreground'>
              Give people a name they will recognize.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='invalid-time'>Start time</Label>
            <Input
              presentation='soft'
              id='invalid-time'
              defaultValue='25:30'
              aria-invalid
              aria-describedby='time-error'
            />
            <p
              id='time-error'
              className='flex items-center gap-2 text-sm text-error'
            >
              <CircleAlert aria-hidden='true' className='size-4' /> Enter a time
              between 00:00 and 23:59.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='disabled-location'>Location</Label>
            <Input
              presentation='soft'
              id='disabled-location'
              disabled
              defaultValue='Choose a date first'
            />
          </div>
        </div>
        <div className='flex min-w-0 flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='details'>A little more detail</Label>
            <Textarea
              presentation='soft'
              id='details'
              placeholder='Anything people should know before they arrive?'
            />
          </div>
          <fieldset className='flex flex-col gap-3'>
            <legend className='mb-3 text-sm font-semibold'>
              Event preferences
            </legend>
            <div className='flex items-center gap-3'>
              <Checkbox
                id='mixed-choice'
                checked={mixed}
                onCheckedChange={setMixed}
              />
              <Label htmlFor='mixed-choice'>Notify people about updates</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox
                presentation='soft'
                id='checked-choice'
                defaultChecked
              />
              <Label htmlFor='checked-choice'>Allow replies</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox presentation='soft' id='disabled-choice' disabled />
              <Label htmlFor='disabled-choice'>Registration closed</Label>
            </div>
          </fieldset>
          <div className='flex items-center gap-3'>
            <Switch presentation='soft' id='reminder-choice' />
            <Label htmlFor='reminder-choice'>Send a reminder</Label>
          </div>
        </div>
      </div>
    </Section>
  );
}
function NavigationAndStatus() {
  return (
    <Section title='Location and status at a glance'>
      <Tabs presentation='soft' defaultValue='events'>
        <TabsList aria-label='Sample Group destinations'>
          <TabsTrigger value='events'>Events</TabsTrigger>
          <TabsTrigger value='people'>People</TabsTrigger>
          <TabsTrigger value='tools'>Tools</TabsTrigger>
        </TabsList>
        <TabsContent value='events'>
          <p className='py-3 text-sm text-muted-foreground'>
            Events shared with this Group.
          </p>
        </TabsContent>
        <TabsContent value='people'>
          <p className='py-3 text-sm text-muted-foreground'>
            The people in this Group.
          </p>
        </TabsContent>
        <TabsContent value='tools'>
          <p className='py-3 text-sm text-muted-foreground'>
            Tools enabled for this Group.
          </p>
        </TabsContent>
      </Tabs>
      <div className='flex flex-wrap gap-3'>
        <Badge presentation='soft' variant='success'>
          <Check aria-hidden='true' className='size-3' /> Completed
        </Badge>
        <Badge presentation='soft' variant='warning'>
          <Clock aria-hidden='true' className='size-3' /> Pending
        </Badge>
        <Badge presentation='soft' variant='destructive'>
          <CircleAlert aria-hidden='true' className='size-3' /> Needs attention
        </Badge>
        <Badge presentation='soft' variant='info'>
          <Users aria-hidden='true' className='size-3' /> Open to members
        </Badge>
      </div>
      <Progress presentation='soft' value={60} aria-label='Setup progress' />
    </Section>
  );
}
function Feedback() {
  const attempts = useRef(0);
  return (
    <Section title='Feedback that stays with you'>
      <div className='flex flex-wrap gap-5'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              presentation='soft'
              variant='outline'
              aria-label='Actions for Picnic in the park'
            >
              <MoreHorizontal aria-hidden='true' /> Event actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => toast({ title: 'Event link copied' })}
              >
                Copy event link
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => toast({ title: 'Draft saved' })}
              >
                Save draft
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          presentation='soft'
          variant='outline'
          onClick={() => toast({ title: 'Changes saved' })}
        >
          Show success feedback
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              presentation='soft'
              variant='outline'
              onClick={() => {
                attempts.current = 0;
              }}
            >
              Review confirmation
            </Button>
          </DialogTrigger>
          <ConfirmationDialog
            presentation='soft'
            title='Remove this draft?'
            description='The first attempt in this preview fails so you can inspect the error and retry.'
            confirmText='Remove draft'
            loadingText='Removing draft'
            onConfirm={async () => {
              attempts.current += 1;
              await new Promise(resolve => window.setTimeout(resolve, 700));
              if (attempts.current === 1) throw new Error('Preview retry');
            }}
          />
        </Dialog>
      </div>
      <Alert>
        <CircleAlert aria-hidden='true' />
        <AlertTitle>Could not save your changes</AlertTitle>
        <AlertDescription>
          Check your connection, then try saving again.
        </AlertDescription>
      </Alert>
      <Toaster />
    </Section>
  );
}
export const Overview: Story = {
  render: () => (
    <GalleryFrame>
      <header className='flex max-w-3xl flex-col gap-3'>
        <Badge presentation='soft' variant='outline'>
          Component review · opt-in preview
        </Badge>
        <Heading level={1} roleSize='page'>
          A playful system with a clear purpose.
        </Heading>
        <p className='text-lg text-muted-foreground'>
          Quiet surfaces. Expressive accents. Actions that feel ready to press.
        </p>
      </header>
      <Actions />
      <SurfaceSamples />
      <Fields />
      <NavigationAndStatus />
      <Feedback />
    </GalleryFrame>
  ),
};
export const ActionsAndSurfaces: Story = {
  render: () => (
    <GalleryFrame>
      <Actions />
      <SurfaceSamples />
    </GalleryFrame>
  ),
};
export const FieldsAndFeedback: Story = {
  render: () => (
    <GalleryFrame>
      <Fields />
      <NavigationAndStatus />
      <Feedback />
    </GalleryFrame>
  ),
};
export const LayoutAndStates: Story = {
  render: () => (
    <GalleryFrame>
      <ListPageTemplate
        presentation='soft'
        title='Make room for a good time'
        subtitle='Page, section, and content headings each have a clear role.'
        controls={
          <Button presentation='soft' icon={<Plus aria-hidden='true' />}>
            Create event
          </Button>
        }
      >
        <div className='flex flex-col gap-10'>
          <SurfaceSamples />
          <Section title='A fresh start'>
            <Card treatment='quiet'>
              <CardContent>
                <EmptyState
                  presentation='soft'
                  icon={<CalendarDays aria-hidden='true' />}
                  message='Your next plan starts here'
                  description='Create an event and invite people to join you.'
                  action={
                    <Button presentation='soft'>Create your first event</Button>
                  }
                />
              </CardContent>
            </Card>
          </Section>
          <Section title='While things are loading'>
            <LoadingState presentation='soft' message='Loading your events…' />
            <div aria-hidden='true' className='grid gap-4 sm:grid-cols-2'>
              <Skeleton presentation='soft' className='h-32 rounded-card' />
              <Skeleton presentation='soft' className='h-32 rounded-card' />
            </div>
          </Section>
        </div>
      </ListPageTemplate>
    </GalleryFrame>
  ),
};
export const LongContent: Story = {
  render: () => (
    <GalleryFrame>
      <ListPageTemplate
        presentation='soft'
        title='A very long event name that needs room to wrap gracefully on a smaller screen'
        controls={
          <Button presentation='soft'>
            Create an event with the neighborhood
          </Button>
        }
      >
        <Card treatment='featured'>
          <CardHeader>
            <CardTitle>
              Weekend plans with friends, family, and everyone else who wants to
              join
            </CardTitle>
            <CardDescription>
              A long description should wrap naturally and leave the next action
              easy to find, including when your text size is increased.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              presentation='soft'
              aria-label='Long event title'
              defaultValue='A wonderfully long and descriptive event name'
            />
          </CardContent>
          <CardFooter className='flex-wrap gap-4'>
            <Button presentation='soft'>
              Save changes and invite everyone
            </Button>
            <Button presentation='soft' variant='outline'>
              Keep editing this event
            </Button>
          </CardFooter>
        </Card>
      </ListPageTemplate>
    </GalleryFrame>
  ),
};
