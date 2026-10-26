import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '../ui/button';
import { useActionMenu } from '../ui/action-menu';
import { useGroup } from '@/hooks/use-groups';
import { useFormPolicy } from '@/hooks/use-group-forms';
import { useListPolicy } from '@/hooks/use-group-lists';
import { usePollPolicy } from '@/hooks/use-group-polls';

type ContentKind = 'Post' | 'Form' | 'List' | 'Poll';
interface NewContentButtonProps {
  base: string;
  allowed?: Partial<Record<ContentKind, boolean>>;
  className?: string;
}
/** One explicit creation action, presented by the app's native bottom sheet. */
export function NewContentButton({
  base,
  allowed,
  className,
}: NewContentButtonProps) {
  const { showActionMenu } = useActionMenu();
  const paths = {
    Post: base.startsWith('/event/') ? 'new-post' : 'posts/create',
    Form: 'forms/create',
    List: 'lists/create',
    Poll: 'polls/create',
  };
  return (
    <Button
      accessibilityLabel='Create new content'
      accessibilityHint='Opens Post, Form, List and Poll choices'
      className={className}
      onPress={() =>
        showActionMenu({
          title: 'Create new content',
          options: (['Post', 'Form', 'List', 'Poll'] as const).map(label => ({
            label,
            icon:
              label === 'Post'
                ? 'chatbubble-outline'
                : label === 'Form'
                  ? 'clipboard-outline'
                  : label === 'List'
                    ? 'list-outline'
                    : 'stats-chart-outline',
            disabled: allowed?.[label] === false,
            onPress: () => router.push(`${base}/${paths[label]}`),
          })),
        })
      }
    >
      + New
    </Button>
  );
}
export function GroupNewContentButton({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const forms = useFormPolicy({ groupId });
  const lists = useListPolicy({ groupId });
  const polls = usePollPolicy({ groupId });
  if (!group || group.joiningQuestionnaire?.canAccessMemberContent === false)
    return null;
  const manager = group.canManageMembers;
  const canCreate = (
    policy: { enabled: boolean; creation: 'MANAGERS' | 'MEMBERS' } | undefined
  ) => !!policy?.enabled && (policy.creation === 'MEMBERS' || manager);
  return (
    <NewContentButton
      base={`/groups/${groupId}`}
      allowed={{
        Post: true,
        Form: canCreate(forms),
        List: canCreate(lists),
        Poll: canCreate(polls),
      }}
    />
  );
}
