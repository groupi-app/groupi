import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RsvpChoices } from '@/components/molecules/rsvp-choices';
import { EditableDateTimeItem } from '@/components/molecules/editable-date-time-item';
import { UnreadIndicator } from '@/components/atoms/unread-indicator';
import { PresenceIndicator } from '@/components/atoms/presence-indicator';

const meta = {
  title: 'Design system/UI regressions',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function RegressionFixture() {
  const [rsvp, setRsvp] = useState<'YES' | 'MAYBE' | 'NO' | 'PENDING'>(
    'PENDING'
  );
  const [option, setOption] = useState({
    id: 'fixture',
    start: new Date(2026, 10, 15, 18),
    end: new Date(2026, 10, 16, 20),
    note: '',
  });
  const [deleted, setDeleted] = useState(false);
  return (
    <main className='mx-auto max-w-4xl space-y-6 p-4'>
      <h1>UI regression fixtures</h1>
      <Tabs defaultValue='upcoming'>
        <TabsList aria-label='Home views'>
          {['Upcoming', 'Attended', 'Invited', 'Discover'].map(label => (
            <TabsTrigger key={label} value={label.toLowerCase()}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {['Upcoming', 'Attended', 'Invited', 'Discover'].map(label => (
          <TabsContent key={label} value={label.toLowerCase()}>
            {label} content
          </TabsContent>
        ))}
      </Tabs>
      <div className='flex items-center gap-4'>
        <UnreadIndicator count={5} />
        <PresenceIndicator status='online' />
        <PresenceIndicator status='away' />
        <PresenceIndicator status='busy' />
      </div>
      <Card interactive edge='none'>
        <CardContent className='p-4'>
          Post surface without sticker edge
        </CardContent>
      </Card>
      <Card interactive>
        <CardContent className='p-4'>Intentional sticker card</CardContent>
      </Card>
      <div className='max-w-md'>
        {!deleted && (
          <EditableDateTimeItem
            option={option}
            onUpdate={updates =>
              setOption(current => ({ ...current, ...updates }))
            }
            onDelete={() => setDeleted(true)}
          />
        )}
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open RSVP fixture</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your RSVP</DialogTitle>
            <DialogDescription>
              Local fixture; no event data is changed.
            </DialogDescription>
          </DialogHeader>
          <RsvpChoices value={rsvp} onChange={setRsvp} />
          <Tabs defaultValue='friends'>
            <TabsList aria-label='Friends and groups views'>
              {['Friends', 'Requests', 'Add', 'Groups'].map(label => (
                <TabsTrigger
                  key={label}
                  value={label.toLowerCase()}
                  className='px-2'
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {['Friends', 'Requests', 'Add', 'Groups'].map(label => (
              <TabsContent key={label} value={label.toLowerCase()}>
                {label} content
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open mobile menu fixture</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Local navigation fixture</SheetDescription>
          </SheetHeader>
          <Button variant='ghost'>Friends &amp; Groups</Button>
        </SheetContent>
      </Sheet>
    </main>
  );
}
export const LayoutAndSurfaces: Story = { render: () => <RegressionFixture /> };
