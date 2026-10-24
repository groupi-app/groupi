'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { useRouter } from 'next/navigation';
import { useUpdateGroup } from '@/hooks/convex/use-groups';
import { GroupIdentityForm } from '@/components/organisms/group-identity-form';
export function GroupEdit({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId as Id<'groups'>);
  const update = useUpdateGroup();
  const router = useRouter();
  if (!group?.canManageIdentity) return null;
  return (
    <div className='max-w-2xl'>
      <GroupIdentityForm
        key={group._id}
        initial={group}
        submitLabel='Save Group'
        onCancel={() => router.push(`/groups/${groupId}`)}
        onSubmit={async ({ name, description, image }) => {
          await update({
            groupId: group._id,
            name,
            description: description || null,
            image: image || null,
          });
          router.push(`/groups/${groupId}`);
        }}
      />
    </div>
  );
}
