import { Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRemoveMember } from '@/hooks/mutations/use-remove-member';
import { useUpdateMemberRole } from '@/hooks/mutations/use-update-member-role';
import { useBanMember } from '@/hooks/mutations/use-ban-member';
import { useState } from 'react';

export enum MemberAction {
  KICK = 'KICK',
  DEMOTE = 'DEMOTE',
  PROMOTE = 'PROMOTE',
  BAN = 'BAN',
}

export function MemberActionDialog({
  member,
  action,
}: {
  member: Doc<"memberships"> & {
    person: (Doc<"persons"> & {
      user: User;
    }) | null;
  };
  action: MemberAction;
}) {
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();
  const banMember = useBanMember();
  const [isLoading, setIsLoading] = useState(false);

  const handleMemberAction = async () => {
    setIsLoading(true);
    try {
      if (action === MemberAction.KICK) {
        await removeMember(member._id);
        toast.success('Attendee kicked', {
          description: 'The attendee has been kicked from the event.',
        });
      } else if (action === MemberAction.DEMOTE) {
        await updateMemberRole(member._id, 'ATTENDEE');
        toast.success('Moderator demoted', {
          description:
            'The moderator has been demoted to a normal attendee.',
        });
      } else if (action === MemberAction.PROMOTE) {
        await updateMemberRole(member._id, 'MODERATOR');
        toast.success('Attendee promoted', {
          description: 'The attendee has been promoted to a moderator.',
        });
      } else if (action === MemberAction.BAN) {
        await banMember(member._id);
        toast.success('Member banned', {
          description: 'The member has been banned from the event.',
        });
      }
    } catch {
      if (action === MemberAction.KICK) {
        toast.error('Failed to kick member', {
          description:
            'The attendee could not be kicked. Please try again.',
        });
      } else if (action === MemberAction.DEMOTE) {
        toast.error('Failed to demote moderator', {
          description:
            'The moderator could not be demoted. Please try again.',
        });
      } else if (action === MemberAction.PROMOTE) {
        toast.error('Failed to promote attendee', {
          description:
            'The attendee could not be promoted. Please try again.',
        });
      } else if (action === MemberAction.BAN) {
        toast.error('Failed to ban member', {
          description:
            'The member could not be banned. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
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
                : action === MemberAction.BAN
                  ? 'Ban Member?'
                  : ''}
        </DialogTitle>
        <DialogDescription>
          {action === MemberAction.KICK
            ? 'Are you sure you want to kick this attendee? They will need to be invited again to rejoin.'
            : action === MemberAction.DEMOTE
              ? 'Are you sure you want to demote this moderator? They will be unable to delete posts or kick/ban attendees.'
              : action === MemberAction.PROMOTE
                ? 'Are you sure you want to promote this attendee? They will be able to delete posts and kick/ban attendees.'
                : action === MemberAction.BAN
                  ? 'Are you sure you want to ban this member? They will be removed from the event and will not be able to rejoin via invites.'
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
                      : action === MemberAction.BAN
                        ? 'Ban'
                        : ''}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
