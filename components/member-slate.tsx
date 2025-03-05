import { getFullName } from "@/lib/utils";
import { Member } from "@/types";
import { Role } from "@prisma/client";
import MemberIcon from "./member-icon";

export function MemberSlate({
  member,
  userId,
  userRole,
  key,
}: {
  member: Member;
  userId: string;
  userRole: Role;
  key: string;
}) {
  const fullName = getFullName(member.person.firstName, member.person.lastName);

  return (
    <div className="flex items-center gap-3 py-2">
      <MemberIcon
        key={key}
        member={member}
        userId={userId}
        userRole={userRole}
      />
      <div className="flex flex-col items-start">
        {fullName != "" && (
          <span className="text-base text-card-foreground">{fullName}</span>
        )}
        <span className="text-muted-foreground">{member.person.username}</span>
      </div>
    </div>
  );
}
