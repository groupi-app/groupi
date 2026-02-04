'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  ProfileViewDialog,
  ProfileTab,
} from '@/components/profile-view-dialog';
import { getInitialsFromName, formatLastSeen, cn } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';
import type {
  Friend,
  FriendRequest,
  MutualEventUser,
} from '@/hooks/convex/use-friends';
import { Calendar } from 'lucide-react';

type FriendListItemVariant =
  | 'friend'
  | 'incoming'
  | 'outgoing'
  | 'search'
  | 'suggestion';

interface FriendListItemProps {
  variant: FriendListItemVariant;
  friend?: Friend;
  request?: FriendRequest;
  searchResult?: {
    personId: Id<'persons'>;
    userId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    friendshipStatus: string;
    friendshipId: Id<'friendships'> | null;
  };
  suggestion?: MutualEventUser;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
  onSendRequest?: () => void;
  onViewProfile?: () => void;
  isLoading?: boolean;
}

export function FriendListItem({
  variant,
  friend,
  request,
  searchResult,
  suggestion,
  onAccept,
  onDecline,
  onCancel,
  onRemove,
  onSendRequest,
  onViewProfile,
  isLoading = false,
}: FriendListItemProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogTab, setProfileDialogTab] =
    useState<ProfileTab>('mutualFriends');

  // Extract user data based on variant
  const name =
    friend?.name ||
    request?.name ||
    searchResult?.name ||
    suggestion?.name ||
    'Unknown User';
  const username =
    friend?.username ||
    request?.username ||
    searchResult?.username ||
    suggestion?.username;
  const image =
    friend?.image || request?.image || searchResult?.image || suggestion?.image;
  const lastSeen = friend?.lastSeen ?? null;
  const userId =
    friend?.userId ||
    request?.userId ||
    searchResult?.userId ||
    suggestion?.userId;

  const initials = getInitialsFromName(name, username || '');
  const presence = lastSeen !== null ? formatLastSeen(lastSeen) : null;

  // Get friendship status from search result or suggestion
  const friendshipStatus =
    searchResult?.friendshipStatus ?? suggestion?.friendshipStatus ?? 'none';

  // Get mutual counts for suggestions and requests
  const mutualEventCount =
    suggestion?.mutualEventCount ?? request?.mutualEventCount ?? 0;
  const mutualFriendCount = suggestion?.mutualFriendCount ?? 0;
  const mutualFriendAvatars = suggestion?.mutualFriendAvatars ?? [];

  // Show mutual info for these variants
  const showMutualInfo =
    (variant === 'suggestion' ||
      variant === 'incoming' ||
      variant === 'outgoing') &&
    (mutualEventCount > 0 || mutualFriendCount > 0);

  // Handler to open profile dialog with specific tab
  const handleOpenProfile = (tab: ProfileTab) => {
    setProfileDialogTab(tab);
    setProfileDialogOpen(true);
  };

  return (
    <div className='flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-card bg-card hover:bg-accent/50 transition-colors'>
      {/* Top row: Avatar + User info */}
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        {/* Avatar with online indicator */}
        <div className='relative shrink-0'>
          <Avatar className='size-10 sm:size-12'>
            <AvatarImage src={image || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {presence && (
            <span
              className={cn(
                'absolute bottom-0 right-0 size-2.5 sm:size-3 rounded-full border-2 border-card',
                presence.isOnline ? 'bg-success' : 'bg-muted-foreground/50'
              )}
            />
          )}
        </div>

        {/* User info */}
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-foreground truncate'>{name}</div>
          {username && (
            <div className='text-sm text-muted-foreground truncate'>
              @{username}
            </div>
          )}
          {presence && (
            <div className='flex items-center gap-1 text-xs'>
              <span
                className={cn(
                  presence.isOnline ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {presence.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compact mutual info - between user info and actions */}
      {showMutualInfo && userId && (
        <div className='flex items-center gap-3 text-sm'>
          {/* Mutual Friends with overlapping avatars */}
          {mutualFriendCount > 0 && (
            <button
              onClick={() => handleOpenProfile('mutualFriends')}
              className='flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors'
            >
              {/* Overlapping avatars */}
              <div className='flex -space-x-2'>
                {mutualFriendAvatars.slice(0, 3).map((friend, idx) => (
                  <Avatar
                    key={idx}
                    className='size-5 border-2 border-card'
                    style={{ zIndex: 3 - idx }}
                  >
                    <AvatarImage src={friend.image || undefined} />
                    <AvatarFallback className='text-[8px]'>
                      {getInitialsFromName(friend.name, '')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className='text-xs'>{mutualFriendCount} mutual</span>
            </button>
          )}

          {/* Separator if both exist */}
          {mutualFriendCount > 0 && mutualEventCount > 0 && (
            <span className='text-muted-foreground'>·</span>
          )}

          {/* Mutual Events */}
          {mutualEventCount > 0 && (
            <button
              onClick={() => handleOpenProfile('mutualEvents')}
              className='flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors'
            >
              <Calendar className='size-3.5' />
              <span className='text-xs'>
                {mutualEventCount} event{mutualEventCount !== 1 ? 's' : ''}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Actions based on variant */}
      <div className='flex items-center gap-2 shrink-0'>
        {variant === 'friend' && (
          <>
            {onViewProfile && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onViewProfile}
                disabled={isLoading}
              >
                <Icons.account className='size-4' />
              </Button>
            )}
            {onRemove && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onRemove}
                disabled={isLoading}
                className='text-destructive hover:text-destructive hover:bg-destructive/10'
              >
                <Icons.close className='size-4' />
              </Button>
            )}
          </>
        )}

        {variant === 'incoming' && (
          <>
            {onAccept && (
              <Button
                variant='default'
                size='sm'
                onClick={onAccept}
                disabled={isLoading}
                isLoading={isLoading}
                icon={<Icons.check className='size-4' />}
              >
                Accept
              </Button>
            )}
            {onDecline && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onDecline}
                disabled={isLoading}
                icon={<Icons.close className='size-4' />}
                className='text-muted-foreground hover:text-foreground'
              >
                Ignore
              </Button>
            )}
          </>
        )}

        {variant === 'outgoing' && onCancel && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onCancel}
            disabled={isLoading}
            isLoading={isLoading}
            icon={<Icons.close className='size-4' />}
            className='text-destructive hover:text-destructive hover:bg-destructive/10'
          >
            Cancel
          </Button>
        )}

        {variant === 'search' && (
          <>
            {friendshipStatus === 'none' && onSendRequest && (
              <Button
                variant='default'
                size='sm'
                onClick={onSendRequest}
                disabled={isLoading}
                isLoading={isLoading}
                icon={<Icons.invite className='size-4' />}
              >
                Add
              </Button>
            )}
            {friendshipStatus === 'pending_sent' && (
              <Button
                variant='secondary'
                size='sm'
                disabled
                icon={<Icons.clock className='size-4' />}
              >
                Sent
              </Button>
            )}
            {friendshipStatus === 'pending_received' && onAccept && (
              <Button
                variant='default'
                size='sm'
                onClick={onAccept}
                disabled={isLoading}
                isLoading={isLoading}
                icon={<Icons.check className='size-4' />}
              >
                Accept
              </Button>
            )}
            {friendshipStatus === 'friends' && (
              <Button
                variant='secondary'
                size='sm'
                disabled
                icon={<Icons.check className='size-4' />}
              >
                Friends
              </Button>
            )}
          </>
        )}

        {variant === 'suggestion' && (
          <>
            {friendshipStatus === 'none' && onSendRequest && (
              <Button
                variant='default'
                size='sm'
                onClick={onSendRequest}
                disabled={isLoading}
                isLoading={isLoading}
                icon={<Icons.invite className='size-4' />}
              >
                Add
              </Button>
            )}
            {friendshipStatus === 'pending_sent' && (
              <Button
                variant='secondary'
                size='sm'
                disabled
                icon={<Icons.clock className='size-4' />}
              >
                Sent
              </Button>
            )}
            {friendshipStatus === 'pending_received' && onAccept && (
              <Button
                variant='default'
                size='sm'
                onClick={onAccept}
                disabled={isLoading}
                isLoading={isLoading}
                icon={<Icons.check className='size-4' />}
              >
                Accept
              </Button>
            )}
          </>
        )}
      </div>

      {/* Profile Dialog with tabs */}
      {userId && (
        <ProfileViewDialog
          userId={userId}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          initialTab={profileDialogTab}
        />
      )}
    </div>
  );
}
