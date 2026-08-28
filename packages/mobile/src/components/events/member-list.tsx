import { View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Id } from 'convex/_generated/dataModel';

import { MemberAvatar } from '@/components/members/member-avatar';
import { SectionHeader } from '@/components/ui/section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MembersData = any;

interface MemberListProps {
  members: MembersData;
  eventId: string;
  canManage: boolean;
}

export function MemberList({ members, eventId, canManage }: MemberListProps) {
  // The query returns { event: { memberships: [...] }, ... }
  // Extract the actual member list from all possible shapes
  const memberList: {
    _id?: string;
    personId?: string;
    person?: { _id: string; user?: { name: string; image?: string } } | null;
    user?: { name: string; image?: string } | null;
    role?: string;
    rsvpStatus?: string;
    rsvpNote?: string;
    membership?: { role: string };
  }[] =
    members?.event?.memberships ??
    members?.members ??
    (Array.isArray(members) ? members : []);

  if (memberList.length === 0) return null;

  // Sort: organizers first, then moderators, then attendees
  const roleOrder: Record<string, number> = {
    ORGANIZER: 0,
    MODERATOR: 1,
    ATTENDEE: 2,
  };
  const sorted = [...memberList].sort((a, b) => {
    const roleA = a.role ?? a.membership?.role ?? 'ATTENDEE';
    const roleB = b.role ?? b.membership?.role ?? 'ATTENDEE';
    return (roleOrder[roleA] ?? 3) - (roleOrder[roleB] ?? 3);
  });

  return (
    <View className='mt-4'>
      <SectionHeader
        title='Members'
        count={memberList.length}
        actionLabel='View All'
        onAction={() => router.push(`/event/${eventId}/attendees`)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className='px-4'
        contentContainerClassName='gap-3 py-2'
      >
        {sorted.slice(0, 15).map(member => {
          const personId = member.personId ?? member.person?._id;
          const userName =
            member.user?.name ?? member.person?.user?.name ?? '?';
          const userImage =
            member.user?.image ?? member.person?.user?.image ?? undefined;

          if (!personId) return null;

          return (
            <MemberAvatar
              key={personId}
              personId={personId as Id<'persons'>}
              src={userImage}
              name={userName}
              size='lg'
              eventMembership={
                member._id
                  ? {
                      membershipId: member._id as Id<'memberships'>,
                      role: (member.role ??
                        member.membership?.role ??
                        'ATTENDEE') as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE',
                      rsvpStatus: (member.rsvpStatus ?? 'PENDING') as
                        | 'YES'
                        | 'MAYBE'
                        | 'NO'
                        | 'PENDING',
                      rsvpNote: member.rsvpNote,
                      viewerRole: members?.userMembership?.role,
                      canManage,
                    }
                  : undefined
              }
            />
          );
        })}
        {canManage ? (
          <Pressable
            onPress={() => router.push(`/event/${eventId}/invite`)}
            className='h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border'
          >
            <Ionicons name='add' size={24} color='#9ca3af' />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
