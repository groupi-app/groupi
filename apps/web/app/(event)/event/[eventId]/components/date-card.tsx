'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Migrated from server actions to tRPC hooks
import { useChooseDateTime } from '@groupi/hooks';
import { cn } from '@/lib/utils';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { Role } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { MemberSlate } from './member-slate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export function DateCard({
  pdt,
  userId,
  userRole,
}: {
  pdt: PotentialDateTimeWithAvailabilities & { rank: number };
  userId: string;
  userRole: Role;
}) {
  const yesAmount = pdt.availabilities.filter(a => a.status === 'YES').length;
  const maybeAmount = pdt.availabilities.filter(
    a => a.status === 'MAYBE'
  ).length;
  const noAmount = pdt.availabilities.filter(a => a.status === 'NO').length;
  const [selectedTab, setSelectedTab] = useState('yes');
  const [dialogType, setDialogType] = useState<'overview' | 'confirm'>(
    'overview'
  );
  const router = useRouter();

  // Use our new tRPC hook with integrated real-time sync
  const chooseDateTimeMutation = useChooseDateTime();

  function selectDate() {
    chooseDateTimeMutation.mutate(
      {
        eventId: pdt.eventId,
        pdtId: pdt.id,
      },
      {
        onSuccess: ([error, _result]: [Error | null, any]) => {
          if (error) {
            toast.error('Failed to select date', {
              description: 'The date could not be selected. Please try again.',
            });
            return;
          }

          toast.success('The date has been successfully selected.');
          router.push(`/event/${pdt.eventId}`);
        },
        onError: () => {
          toast.error('Failed to select date', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        asChild
        onClick={() => {
          setDialogType('overview');
        }}
      >
        <div className='w-full md:max-w-md border border-border shadow-md rounded-md py-2 px-3 hover:bg-accent transition-all cursor-pointer'>
          <div className='flex items-center gap-4'>
            <h1 className='font-semibold text-2xl'>#{pdt.rank}</h1>
            <div className='flex flex-col'>
              <h1>
                {pdt.dateTime.toLocaleDateString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              <span className='text-sm text-muted-foreground'>
                {pdt.dateTime.toLocaleTimeString([], { timeStyle: 'short' })}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <div className='flex items-center gap-1'>
              <Icons.check className='size-6 rounded-full  text-green-500' />
              <span>{yesAmount}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='rounded-full size-6 text-center font-semibold text-yellow-500 cursor-default'>
                <span>?</span>
              </div>
              <span>{maybeAmount}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Icons.close className='size-6 rounded-full text-red-500' />

              <span>{noAmount}</span>
            </div>
          </div>
          <div className='w-full rounded-full border border-border h-4 flex items-center'>
            <div
              className={cn(
                'h-full bg-green-500 rounded-l-full',
                maybeAmount === 0 && noAmount === 0 ? 'rounded-r-full' : ''
              )}
              style={{
                width: `${(yesAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
            <div
              className={cn(
                'h-full bg-yellow-500',
                yesAmount === 0 ? 'rounded-l-full' : '',
                noAmount === 0 ? 'rounded-r-full' : ''
              )}
              style={{
                width: `${(maybeAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
            <div
              className={cn(
                ' h-full bg-red-500 rounded-r-full',
                yesAmount === 0 && maybeAmount === 0 ? 'rounded-l-full' : ''
              )}
              style={{
                width: `${(noAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        {dialogType === 'overview' && (
          <>
            <DialogHeader className='text-left'>
              <h1 className='font-semibold text-2xl'>
                {pdt.dateTime.toLocaleDateString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              <h2 className='text-muted-foreground text-lg'>
                {pdt.dateTime.toLocaleTimeString([], { timeStyle: 'short' })}
              </h2>
            </DialogHeader>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value='yes'>
                  <div className='flex items-center gap-1'>
                    <span>Yes</span>
                    <div
                      className={cn(
                        'rounded-full size-5 text-center text-muted-foreground cursor-default flex items-center justify-center',
                        selectedTab === 'yes' &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      <span>{yesAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value='maybe'>
                  <div className='flex items-center gap-1'>
                    <span>Maybe</span>
                    <div
                      className={cn(
                        'rounded-full size-5 text-center text-muted-foreground cursor-default flex items-center justify-center',
                        selectedTab === 'maybe' &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      <span>{maybeAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value='no'>
                  <div className='flex items-center gap-1'>
                    <span>No</span>
                    <div
                      className={cn(
                        'rounded-full size-5 text-center text-muted-foreground cursor-default flex items-center justify-center',
                        selectedTab === 'no' &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      <span>{noAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value='yes'>
                <ScrollArea className='h-64'>
                  <div className='flex flex-col divide-y'>
                    {pdt.availabilities
                      .filter(a => a.status === 'YES')
                      .map(availability => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                          eventDateTime={null}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value='maybe'>
                <ScrollArea className='h-64'>
                  <div className='flex flex-col divide-y'>
                    {pdt.availabilities
                      .filter(a => a.status === 'MAYBE')
                      .map(availability => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                          eventDateTime={null}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value='no'>
                <ScrollArea className='h-64'>
                  <div className='flex flex-col divide-y'>
                    {pdt.availabilities
                      .filter(a => a.status === 'NO')
                      .map(availability => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                          eventDateTime={null}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            <div className='flex justify-end gap-1 items-center '>
              <DialogClose asChild>
                <Button variant='ghost'>Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setDialogType('confirm');
                }}
              >
                Select This Date
              </Button>
            </div>
          </>
        )}
        {dialogType === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Selection</DialogTitle>
              <DialogDescription>
                Are you sure you want to select this date? If you change your
                mind, you can always pick a different date or run a new poll.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDialogType('overview');
                }}
                variant='ghost'
              >
                Cancel
              </Button>
              <DialogClose asChild>
                <Button
                  className='flex items-center gap-1'
                  onClick={selectDate}
                  disabled={chooseDateTimeMutation.isLoading}
                >
                  {chooseDateTimeMutation.isLoading && (
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                  )}
                  <span>Confirm</span>
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
