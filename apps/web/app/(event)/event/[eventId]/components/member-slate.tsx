import { MemberListPageData } from '@groupi/schema';
import { Role } from '@prisma/client';

type Member = MemberListPageData['event']['memberships'][0];
import MemberIcon from './member-icon';

export function MemberSlate({
  member,
  userId,
  userRole,
  eventDateTime,
  key,
}: {
  member: Member;
  userId: string;
  userRole: Role;
  eventDateTime: Date | null;
  key: string;
}) {
  const fullName = member.person.user.name || member.person.user.email;

  return (
    <div className='flex items-center gap-3 py-2'>
      <MemberIcon
        itemKey={key}
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
          {member.person.user.name || member.person.user.email}
        </span>
      </div>
    </div>
  );
}
