'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Migrated from server actions to tRPC hooks
import { useRemoveMember, useUpdateMemberRole } from '@groupi/hooks';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  // Use our new tRPC hooks with integrated real-time sync
  const removeMemberMutation = useRemoveMember();
  const updateMemberRoleMutation = useUpdateMemberRole();

  const handleMemberAction = () => {
    if (action === MemberAction.KICK) {
      removeMemberMutation.mutate(
        { memberId: member.id },
        {
          onSuccess: ([error, _result]) => {
            if (error) {
              toast.error('Failed to kick member', {
                description:
                  'The attendee could not be kicked. Please try again.',
              });
              return;
            }

            toast.success('Attendee kicked', {
              description: 'The attendee has been kicked from the event.',
            });
          },
          onError: () => {
            toast.error('Failed to kick member', {
              description: 'An unexpected error occurred. Please try again.',
            });
          },
        }
      );
    } else if (action === MemberAction.DEMOTE) {
      updateMemberRoleMutation.mutate(
        {
          membershipId: member.id,
          role: 'ATTENDEE',
        },
        {
          onSuccess: ([error, _result]) => {
            if (error) {
              toast.error('Failed to demote moderator', {
                description:
                  'The moderator could not be demoted. Please try again.',
              });
              return;
            }

            toast.success('Moderator demoted', {
              description:
                'The moderator has been demoted to a normal attendee.',
            });
          },
          onError: () => {
            toast.error('Failed to demote moderator', {
              description: 'An unexpected error occurred. Please try again.',
            });
          },
        }
      );
    } else if (action === MemberAction.PROMOTE) {
      updateMemberRoleMutation.mutate(
        {
          membershipId: member.id,
          role: 'MODERATOR',
        },
        {
          onSuccess: ([error, _result]) => {
            if (error) {
              toast.error('Failed to promote attendee', {
                description:
                  'The attendee could not be promoted. Please try again.',
              });
              return;
            }

            toast.success('Attendee promoted', {
              description: 'The attendee has been promoted to a moderator.',
            });
          },
          onError: () => {
            toast.error('Failed to promote attendee', {
              description: 'An unexpected error occurred. Please try again.',
            });
          },
        }
      );
    }
  };

  // Check if any mutation is loading
  const isLoading =
    removeMemberMutation.isLoading || updateMemberRoleMutation.isLoading;

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
