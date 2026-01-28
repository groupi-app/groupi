import MemberIcon from '@/components/member-icon';
import { Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';

export function MemberSlate({
  member,
  userId,
  userRole,
  eventDateTime,
  itemKey,
}: {
  member: Doc<'memberships'> & {
    person:
      | (Doc<'persons'> & {
          user: User;
        })
      | null;
  };
  userId: string;
  userRole: string;
  eventDateTime: Date | null;
  itemKey: string;
}) {
  const fullName =
    member.person?.user?.name || member.person?.user?.email || '';

  return (
    <div className='flex items-center gap-3 py-2'>
      <MemberIcon
        itemKey={itemKey}
        member={member}
        userId={userId}
        userRole={userRole}
        eventDateTime={eventDateTime}
      />
      <div className='flex flex-col items-start'>
        {fullName != '' && (
          <span className='text-base text-card-foreground'>{fullName}</span>
        )}
        <span className='text-muted-foreground'>
          {member.person?.user?.name || member.person?.user?.email}
        </span>
      </div>
    </div>
  );
}
