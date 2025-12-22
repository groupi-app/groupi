'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRemoveMember } from '@/hooks/mutations/use-remove-member';
import { useUpdateMemberRole } from '@/hooks/mutations/use-update-member-role';

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
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();

  const handleMemberAction = () => {
    if (action === MemberAction.KICK) {
      removeMember.mutate(
        { memberId: member.id },
        {
          onSuccess: () => {
            toast.success('Attendee kicked', {
              description: 'The attendee has been kicked from the event.',
            });
          },
          onError: () => {
            toast.error('Failed to kick member', {
              description:
                'The attendee could not be kicked. Please try again.',
            });
          },
        }
      );
    } else if (action === MemberAction.DEMOTE) {
      updateMemberRole.mutate(
        {
          membershipId: member.id,
          role: 'ATTENDEE',
        },
        {
          onSuccess: () => {
            toast.success('Moderator demoted', {
              description:
                'The moderator has been demoted to a normal attendee.',
            });
          },
          onError: () => {
            toast.error('Failed to demote moderator', {
              description:
                'The moderator could not be demoted. Please try again.',
            });
          },
        }
      );
    } else if (action === MemberAction.PROMOTE) {
      updateMemberRole.mutate(
        {
          membershipId: member.id,
          role: 'MODERATOR',
        },
        {
          onSuccess: () => {
            toast.success('Attendee promoted', {
              description: 'The attendee has been promoted to a moderator.',
            });
          },
          onError: () => {
            toast.error('Failed to promote attendee', {
              description:
                'The attendee could not be promoted. Please try again.',
            });
          },
        }
      );
    }
  };

  const isLoading = removeMember.isPending || updateMemberRole.isPending;

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
