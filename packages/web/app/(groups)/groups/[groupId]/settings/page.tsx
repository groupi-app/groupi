'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
export default function Page() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const group = useGroup(groupId as Id<'groups'>);
  useEffect(() => {
    if (group)
      router.replace(
        `/groups/${groupId}/settings/${group.canManageMembers || group.canManageRoles ? 'admissions' : group.canManageInvitations ? 'invitations' : 'ownership'}`
      );
  }, [group, groupId, router]);
  return <p role='status'>Opening Group settings…</p>;
}
