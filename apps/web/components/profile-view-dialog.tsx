'use client';

import { useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  fetchUserProfileAction,
  fetchMutualEventsAction,
} from '@/actions/query-actions';
import { qk } from '@/lib/query-keys';
import { Icons } from '@/components/icons';
import { useSession } from '@/lib/auth-client';

interface ProfileViewDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = 'profile' | 'mutualEvents';

export function ProfileViewDialog({
  userId,
  open,
  onOpenChange,
}: ProfileViewDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('profile');
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: qk.users.profile(userId),
    queryFn: () => fetchUserProfileAction(userId),
    enabled: open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  const isOwnProfile = currentUserId === userId;

  const {
    data: mutualEventsData,
    isLoading: isLoadingMutualEvents,
    error: mutualEventsError,
  } = useQuery({
    queryKey: currentUserId
      ? qk.users.mutualEvents(currentUserId, userId)
      : ['users', 'mutualEvents', 'pending'],
    queryFn: () => fetchMutualEventsAction(userId),
    enabled: open && !!currentUserId && !isOwnProfile, // Only fetch when dialog is open, we have current user ID, and it's not own profile
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  const userProfile = profile?.[1]; // Extract data from tuple
  const profileError = profile?.[0] || error;
  const mutualEvents = mutualEventsData?.[1] || []; // Extract data from tuple
  const mutualEventsDataError = mutualEventsData?.[0] || mutualEventsError;
  const mutualEventsCount = mutualEvents.length;

  const initials = getInitialsFromName(
    userProfile?.name || null,
    userProfile?.email || ''
  );

  // Reset to profile view when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setViewMode('profile');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-4'>
            {viewMode === 'mutualEvents' && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setViewMode('profile')}
              >
                <Icons.back className='size-4' />
              </Button>
            )}
            <div className='flex-1'>
              <DialogTitle className={viewMode === 'profile' ? 'sr-only' : ''}>
                {viewMode === 'profile' ? 'Profile' : 'Mutual Events'}
              </DialogTitle>
              <DialogDescription className='sr-only'>
                {viewMode === 'profile'
                  ? 'View user profile information'
                  : 'Events you both are members of'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {viewMode === 'profile' ? (
          <>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : profileError ? (
              <div className='flex items-center justify-center py-8'>
                <p className='text-sm text-destructive'>
                  Failed to load profile. Please try again.
                </p>
              </div>
            ) : userProfile ? (
              <div className='space-y-4'>
                {/* Profile Picture and Name */}
                <div className='flex items-start gap-4'>
                  <Avatar className='h-20 w-20'>
                    <AvatarImage src={userProfile.image || undefined} />
                    <AvatarFallback className='text-lg'>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col gap-1 flex-1'>
                    <h3 className='text-xl font-semibold'>
                      {userProfile.name || 'No name'}
                    </h3>
                    <div className='flex items-center gap-1 text-muted-foreground'>
                      <span>@{userProfile.username || 'username'}</span>
                      {userProfile.pronouns && (
                        <>
                          <span>·</span>
                          <span>{userProfile.pronouns}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {userProfile.bio && (
                  <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                    {userProfile.bio}
                  </p>
                )}

                {/* Mutual Events Button - only show if not own profile */}
                {currentUserId && !isOwnProfile && (
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setViewMode('mutualEvents')}
                  >
                    <Icons.party className='size-4 mr-2' />
                    Mutual Events {mutualEventsCount}
                  </Button>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {isLoadingMutualEvents || !currentUserId ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : mutualEventsDataError ? (
              <div className='flex items-center justify-center py-8'>
                <p className='text-sm text-destructive'>
                  Failed to load mutual events. Please try again.
                </p>
              </div>
            ) : mutualEvents.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <p className='text-sm text-muted-foreground'>
                  No mutual events found.
                </p>
              </div>
            ) : (
              <div className='space-y-2'>
                {mutualEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    onClick={() => handleOpenChange(false)}
                  >
                    <div className='flex items-center gap-3 border border-border shadow-sm p-2 hover:bg-accent transition-all cursor-pointer rounded-md'>
                      <h3 className='font-heading text-sm shrink-0 min-w-0 flex-1 truncate'>
                        {event.title}
                      </h3>
                      {event.location && (
                        <div className='flex items-center gap-1 shrink-0 min-w-0'>
                          <Icons.location className='size-3 text-primary' />
                          <span className='text-xs text-muted-foreground truncate max-w-[100px]'>
                            {event.location}
                          </span>
                        </div>
                      )}
                      <div className='flex items-center gap-1 shrink-0'>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
