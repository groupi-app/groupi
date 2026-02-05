'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFriendActions, FriendshipStatus } from '@/hooks/convex/use-friends';
import { Id } from '@/convex/_generated/dataModel';

interface FriendRequestButtonProps {
  personId: Id<'persons'> | undefined;
  variant?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function FriendRequestButton({
  personId,
  variant = 'default',
  className,
}: FriendRequestButtonProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const {
    status,
    isLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriendActions(personId);

  const handleSendRequest = async () => {
    setIsActioning(true);
    await sendRequest();
    setIsActioning(false);
  };

  const handleAcceptRequest = async () => {
    setIsActioning(true);
    await acceptRequest();
    setIsActioning(false);
  };

  const handleDeclineRequest = async () => {
    setIsActioning(true);
    await declineRequest();
    setIsActioning(false);
  };

  const handleCancelRequest = async () => {
    setIsActioning(true);
    await cancelRequest();
    setIsActioning(false);
  };

  const handleRemoveFriend = async () => {
    setIsActioning(true);
    await removeFriend();
    setIsActioning(false);
    setShowRemoveDialog(false);
  };

  if (!personId) {
    return null;
  }

  if (isLoading) {
    return (
      <Button
        variant='ghost'
        size={variant === 'sm' ? 'sm' : variant === 'icon' ? 'icon' : 'default'}
        disabled
        className={className}
      >
        <Icons.spinner className='size-4 animate-spin' />
      </Button>
    );
  }

  // Handle different friendship statuses
  const renderButton = () => {
    switch (status as FriendshipStatus) {
      case 'self':
        // Don't show button for self
        return null;

      case 'none':
      case 'declined':
        return (
          <Button
            variant='default'
            size={
              variant === 'sm' ? 'sm' : variant === 'icon' ? 'icon' : 'default'
            }
            onClick={handleSendRequest}
            disabled={isActioning}
            isLoading={isActioning}
            className={className}
          >
            {variant !== 'icon' && (
              <>
                <Icons.invite className='size-4 mr-1' />
                Add Friend
              </>
            )}
            {variant === 'icon' && <Icons.invite className='size-4' />}
          </Button>
        );

      case 'pending_sent':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='secondary'
                size={
                  variant === 'sm'
                    ? 'sm'
                    : variant === 'icon'
                      ? 'icon'
                      : 'default'
                }
                className={className}
              >
                {variant !== 'icon' && (
                  <>
                    <Icons.clock className='size-4 mr-1' />
                    Request Sent
                    <Icons.down className='size-4 ml-1' />
                  </>
                )}
                {variant === 'icon' && <Icons.clock className='size-4' />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={handleCancelRequest}
                className='text-destructive focus:text-destructive cursor-pointer'
              >
                <Icons.close className='size-4 mr-2' />
                Cancel Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );

      case 'pending_received':
        return (
          <div className='flex gap-2'>
            <Button
              variant='default'
              size={variant === 'sm' ? 'sm' : 'default'}
              onClick={handleAcceptRequest}
              disabled={isActioning}
              isLoading={isActioning}
              className={className}
            >
              <Icons.check className='size-4 mr-1' />
              {variant !== 'icon' && 'Accept'}
            </Button>
            <Button
              variant='ghost'
              size={variant === 'sm' ? 'sm' : 'icon'}
              onClick={handleDeclineRequest}
              disabled={isActioning}
              className='hover:bg-destructive hover:text-destructive-foreground'
            >
              <Icons.close className='size-4' />
            </Button>
          </div>
        );

      case 'friends':
        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='secondary'
                  size={
                    variant === 'sm'
                      ? 'sm'
                      : variant === 'icon'
                        ? 'icon'
                        : 'default'
                  }
                  className={className}
                >
                  {variant !== 'icon' && (
                    <>
                      <Icons.check className='size-4 mr-1' />
                      Friends
                      <Icons.down className='size-4 ml-1' />
                    </>
                  )}
                  {variant === 'icon' && <Icons.people className='size-4' />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setShowRemoveDialog(true)}
                  className='text-destructive focus:text-destructive cursor-pointer'
                >
                  <Icons.close className='size-4 mr-2' />
                  Remove Friend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
              open={showRemoveDialog}
              onOpenChange={setShowRemoveDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this friend? You can send a
                    new friend request later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveFriend}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );

      default:
        return null;
    }
  };

  return renderButton();
}
