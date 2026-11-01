'use client';

import type { Id } from '@/convex/_generated/dataModel';
import { useFormPolicy } from '@/hooks/convex/use-group-forms';
import { useListPolicy } from '@/hooks/convex/use-group-lists';
import { usePollPolicy } from '@/hooks/convex/use-group-polls';
import { NewContentMenu } from './new-content-menu';

export function GroupNewContent({
  groupId,
  manager,
  eligible,
}: {
  groupId: Id<'groups'>;
  manager: boolean;
  eligible: boolean;
}) {
  const forms = useFormPolicy({ groupId });
  const lists = useListPolicy({ groupId });
  const polls = usePollPolicy({ groupId });
  if (!eligible) return null;
  const canCreate = (
    policy: Pick<NonNullable<typeof forms>, 'enabled' | 'creation'> | undefined
  ) => Boolean(policy?.enabled && (manager || policy.creation === 'MEMBERS'));
  return (
    <NewContentMenu
      context='group'
      basePath={`/groups/${groupId}`}
      allowed={{
        post: true,
        form: canCreate(forms),
        list: canCreate(lists),
        poll: canCreate(polls),
      }}
    />
  );
}
