'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';
import { fetchMutualEventsAction } from '@/actions/query-actions';
import { qk } from '@/lib/query-keys';
import { useSession } from '@/lib/auth-client';

interface MutualEventsDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MutualEventsDialog({
  userId,
  open,
  onOpenChange,
}: MutualEventsDialogProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: currentUserId
      ? qk.users.mutualEvents(currentUserId, userId)
      : ['users', 'mutualEvents', 'pending'],
    queryFn: () => fetchMutualEventsAction(userId),
    enabled: open && !!currentUserId, // Only fetch when dialog is open and we have current user ID
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  const events = eventsData?.[1] || []; // Extract data from tuple
  const eventsError = eventsData?.[0] || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Mutual Events</DialogTitle>
          <DialogDescription>
            Events you both are members of
          </DialogDescription>
        </DialogHeader>

        {isLoading || !currentUserId ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : eventsError ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-destructive'>
              Failed to load mutual events. Please try again.
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-muted-foreground'>
              No mutual events found.
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {events.map(event => (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                onClick={() => onOpenChange(false)}
              >
                <div className='flex items-center gap-3 border border-border shadow-sm p-2 hover:bg-accent transition-all cursor-pointer rounded-md'>
                  <h3 className='font-heading text-sm flex-shrink-0 min-w-0 flex-1 truncate'>
                    {event.title}
                  </h3>
                  {event.location && (
                    <div className='flex items-center gap-1 flex-shrink-0 min-w-0'>
                      <Icons.location className='size-3 text-primary' />
                      <span className='text-xs text-muted-foreground truncate max-w-[100px]'>
                        {event.location}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Icons.date className='size-3 text-primary' />
                    {event.chosenDateTime ? (
                      <span className='text-xs text-muted-foreground whitespace-nowrap'>
                        {new Date(event.chosenDateTime).toLocaleString([], {
                          weekday: 'short',
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className='text-xs text-muted-foreground whitespace-nowrap'>
                        TBD
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className='flex justify-end'>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

