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
import { useSession } from '@/lib/auth-client';
import { useMutualEvents } from '@/hooks/convex/use-events';
import { Id } from '@/convex/_generated/dataModel';

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
  const currentUserId = session?.user?.id as string | undefined;

  // Use Convex hook for real-time mutual events data
  const mutualEventsData = useMutualEvents(userId);

  // Loading state
  const isLoading = mutualEventsData === undefined;
  // Type annotation to avoid implicit any
  interface MutualEvent {
    id: Id<'events'>;
    title: string;
    location?: string | null;
    chosenDateTime?: number | null;
  }
  const events: MutualEvent[] = mutualEventsData || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Mutual Events</DialogTitle>
          <DialogDescription>Events you both are members of</DialogDescription>
        </DialogHeader>

        {isLoading || !currentUserId ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : events.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-muted-foreground'>
              No mutual events found.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {events.map(event => (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                onClick={() => onOpenChange(false)}
              >
                <div className='flex items-center gap-3 border border-border shadow-raised p-2 hover:bg-accent transition-all cursor-pointer rounded-md'>
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
