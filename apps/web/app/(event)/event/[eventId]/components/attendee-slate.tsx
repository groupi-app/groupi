import { cn } from '@/lib/utils';
import { EventAttendeesPageDTO, RoleType, StatusType } from '@groupi/schema';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { MemberAction, MemberActionDialog } from './member-action-dialog';
import MemberIcon from './member-icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AvailabilityWithDateTime = {
  status: StatusType;
  membershipId: string;
  potentialDateTimeId: string;
  potentialDateTime: {
    id: string;
    eventId: string;
    dateTime: Date;
  };
};

type Attendee = EventAttendeesPageDTO['event']['memberships'][0] & {
  event?: { chosenDateTime: Date | null };
  availabilities?: AvailabilityWithDateTime[];
};

export function AttendeeSlate({
  userId,
  userRole,
  member,
  itemKey,
}: {
  userId: string;
  userRole: RoleType;
  member: Attendee;
  itemKey: string;
}) {
  const [dialogAction, setDialogAction] = useState<MemberAction>(
    MemberAction.KICK
  );

  const [availabilitiesOpen, setAvailabilitiesOpen] = useState(false);

  const fullName = member.person.user.name || member.person.user.email;

  const isMe = userId === member.person.id;

  const canKick =
    !isMe &&
    ((userRole === 'MODERATOR' && member.role === 'ATTENDEE') ||
      userRole === 'ORGANIZER');

  const canPromote = !isMe && userRole === 'ORGANIZER';

  const dateNotSelected = member.event?.chosenDateTime === null;

  return (
    <Dialog>
      <div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 py-2 items-center'>
          <div className='flex items-center gap-2'>
            <MemberIcon
              itemKey={itemKey}
              member={member}
              userId={userId}
              userRole={userRole}
              eventDateTime={member.event?.chosenDateTime ?? null}
            />
            <div>
              <div className='text-lg'>{fullName}</div>
              <div className='text-muted-foreground'>
                {member.person.user.name || member.person.user.email}
              </div>
            </div>
          </div>
          <div className='flex items-center text-muted-foreground gap-1 '>
            {member.role === 'ORGANIZER' && <Icons.crown />}
            {member.role === 'MODERATOR' && <Icons.shield />}
            {member.role === 'ATTENDEE' && <Icons.account />}
            <div>{member.role}</div>
          </div>{' '}
          {dateNotSelected ? (
            <Button
              className='flex items-center gap-1 w-max'
              onClick={() => setAvailabilitiesOpen(!availabilitiesOpen)}
              variant='ghost'
            >
              <span>Availability</span>
              {availabilitiesOpen ? (
                <Icons.up className='size-4' />
              ) : (
                <Icons.down className='size-4' />
              )}
            </Button>
          ) : (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <span>RSVP: </span>
              {member.rsvpStatus === 'YES' && (
                <Icons.check className='text-green-500' />
              )}
              {member.rsvpStatus === 'MAYBE' && (
                <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                  ?
                </span>
              )}
              {member.rsvpStatus === 'NO' && (
                <Icons.close className='text-red-500' />
              )}
              <span className='text-foreground'>{member.rsvpStatus}</span>
            </div>
          )}
          <div className='flex items-center gap-1'>
            {!isMe && canPromote && member.role === 'ATTENDEE' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setDialogAction(MemberAction.PROMOTE);
                      }}
                      size='icon'
                      variant='outline'
                    >
                      <Icons.shield />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Promote</TooltipContent>
              </Tooltip>
            )}
            {!isMe && canPromote && member.role === 'MODERATOR' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setDialogAction(MemberAction.DEMOTE);
                      }}
                      className='hover:bg-destructive hover:text-destructive-foreground'
                      size='icon'
                      variant='outline'
                    >
                      <Icons.shieldOff />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Demote</TooltipContent>
              </Tooltip>
            )}
            {!isMe && canKick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setDialogAction(MemberAction.KICK);
                      }}
                      className='hover:bg-destructive hover:text-destructive-foreground'
                      size='icon'
                      variant='outline'
                    >
                      <Icons.kick />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Kick</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <AnimatePresence>
          {dateNotSelected && availabilitiesOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
              className='flex flex-col gap-2 overflow-hidden'
            >
              {member.availabilities && member.availabilities.length > 0 ? (
                member.availabilities
                  .sort(
                    (a, b) =>
                      a.potentialDateTime.dateTime.getTime() -
                      b.potentialDateTime.dateTime.getTime()
                  )
                  .map((availability, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-8 p-2',
                        i % 2 == 0 ? 'bg-muted' : ''
                      )}
                    >
                      <div className='flex flex-col'>
                        <h1>
                          {availability.potentialDateTime.dateTime.toLocaleDateString(
                            [],
                            {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </h1>
                        <span className='text-sm text-muted-foreground'>
                          {availability.potentialDateTime.dateTime.toLocaleTimeString(
                            [],
                            { timeStyle: 'short' }
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        {availability.status === 'YES' && (
                          <Icons.check className='size-6 text-green-500' />
                        )}
                        {availability.status === 'MAYBE' && (
                          <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                            ?
                          </span>
                        )}
                        {availability.status === 'NO' && (
                          <Icons.close className='size-6 text-red-500' />
                        )}
                        <span>{availability.status}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.33 }}
                  className='p-2'
                >
                  Availability Pending...
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <MemberActionDialog action={dialogAction} member={member} />
    </Dialog>
  );
}
