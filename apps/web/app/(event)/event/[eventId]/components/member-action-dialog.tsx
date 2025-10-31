'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  removeMemberAction,
  updateMemberRoleAction,
} from '@/actions/membership-actions';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export enum MemberAction {
  KICK = 'KICK',
  DEMOTE = 'DEMOTE',
  PROMOTE = 'PROMOTE',
}

export function MemberActionDialog({
  member,
  action,
}: {
  member: Member;
  action: MemberAction;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMemberAction = async () => {
    setIsLoading(true);

    if (action === MemberAction.KICK) {
      const [error] = await removeMemberAction({ memberId: member.id });

      if (error) {
        toast.error('Failed to kick member', {
          description: 'The attendee could not be kicked. Please try again.',
        });
        setIsLoading(false);
      } else {
        toast.success('Attendee kicked', {
          description: 'The attendee has been kicked from the event.',
        });
      }
    } else if (action === MemberAction.DEMOTE) {
      const [error] = await updateMemberRoleAction({
        membershipId: member.id,
        role: 'ATTENDEE',
      });

      if (error) {
        toast.error('Failed to demote moderator', {
          description: 'The moderator could not be demoted. Please try again.',
        });
        setIsLoading(false);
      } else {
        toast.success('Moderator demoted', {
          description: 'The moderator has been demoted to a normal attendee.',
        });
      }
    } else if (action === MemberAction.PROMOTE) {
      const [error] = await updateMemberRoleAction({
        membershipId: member.id,
        role: 'MODERATOR',
      });

      if (error) {
        toast.error('Failed to promote attendee', {
          description: 'The attendee could not be promoted. Please try again.',
        });
        setIsLoading(false);
      } else {
        toast.success('Attendee promoted', {
          description: 'The attendee has been promoted to a moderator.',
        });
      }
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {action === MemberAction.KICK
            ? 'Kick Attendee?'
            : action === MemberAction.DEMOTE
              ? 'Demote Moderator?'
              : action === MemberAction.PROMOTE
                ? 'Promote Attendee?'
                : ''}
        </DialogTitle>
        <DialogDescription>
          {action === MemberAction.KICK
            ? 'Are you sure you want to kick this attendee? They will need to be invited again to rejoin.'
            : action === MemberAction.DEMOTE
              ? 'Are you sure you want to demote this moderator? They will be unable to delete posts or kick/ban attendees.'
              : action === MemberAction.PROMOTE
                ? 'Are you sure you want to promote this attendee? They will be able to delete posts and kick/ban attendees.'
                : ''}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div className='flex items-center gap-2'>
          <DialogClose className='grow' asChild>
            <Button variant='ghost' disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose className='grow' asChild>
            <Button
              onClick={handleMemberAction}
              disabled={isLoading}
              className='w-full'
              variant={
                action === MemberAction.PROMOTE ? 'default' : 'destructive'
              }
            >
              {isLoading
                ? 'Processing...'
                : action === MemberAction.KICK
                  ? 'Kick'
                  : action === MemberAction.DEMOTE
                    ? 'Demote'
                    : action === MemberAction.PROMOTE
                      ? 'Promote'
                      : ''}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
