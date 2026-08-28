import { Pressable } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';

import {
  useMemberDrawer,
  type MemberDrawerTarget,
} from '@/components/events/member-drawer';
import { UserAvatar, type UserAvatarProps } from '@/components/ui/user-avatar';
import { createMemberDrawerTarget } from './member-avatar-target';

interface MemberAvatarProps extends UserAvatarProps {
  personId: Id<'persons'>;
  eventMembership?: MemberDrawerTarget['eventMembership'];
}

const HIT_SLOP_BY_SIZE = {
  xs: 10,
  sm: 6,
  md: 4,
  lg: 2,
  xl: 0,
} as const;

export function MemberAvatar({
  personId,
  eventMembership,
  src,
  name,
  size = 'md',
  ...avatarProps
}: MemberAvatarProps) {
  const { showMember } = useMemberDrawer();

  function handlePress(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    showMember(
      createMemberDrawerTarget({
        personId,
        name,
        image: src,
        eventMembership,
      })
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={HIT_SLOP_BY_SIZE[size]}
      accessibilityRole='button'
      accessibilityLabel={`View ${name ?? 'member'} details`}
      accessibilityHint='Opens the member drawer'
      className='rounded-full active:opacity-80'
    >
      <UserAvatar {...avatarProps} src={src} name={name} size={size} />
    </Pressable>
  );
}
