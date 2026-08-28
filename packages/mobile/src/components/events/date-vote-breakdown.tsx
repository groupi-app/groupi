import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { MemberAvatar } from '@/components/members/member-avatar';
import { Text } from '@/components/ui/text';
import { useEventAvailabilityData } from '@/hooks/use-availability';
import {
  getAvailabilityVoteCounts,
  getAvailabilityVotePercentages,
  type AvailabilityVoteStatus,
} from '@groupi/shared/utils';

type AvailabilityData = NonNullable<
  ReturnType<typeof useEventAvailabilityData>
>;
type PotentialDate = AvailabilityData['potentialDateTimes'][number];
type Availability = PotentialDate['availabilities'][number];

interface DateVoteBreakdownProps {
  date: PotentialDate;
  viewerRole: AvailabilityData['userRole'];
  expanded: boolean;
  onToggle: () => void;
}

const VOTE_GROUPS = [
  { status: 'YES', label: 'Yes', icon: 'checkmark-circle' },
  { status: 'MAYBE', label: 'Maybe', icon: 'help-circle' },
  { status: 'NO', label: 'No', icon: 'close-circle' },
] as const;

function getMemberUser(availability: Availability) {
  return availability.member.user ?? availability.member.person?.user;
}

function getMemberName(availability: Availability): string {
  const user = getMemberUser(availability);
  return user?.name ?? user?.username ?? user?.email ?? 'Member';
}

function statusTextClass(status: AvailabilityVoteStatus): string {
  switch (status) {
    case 'YES':
      return 'text-text-success';
    case 'MAYBE':
      return 'text-text-warning';
    case 'NO':
      return 'text-text-error';
    case 'PENDING':
      return 'text-muted-foreground';
  }
}

export function DateVoteBreakdown({
  date,
  viewerRole,
  expanded,
  onToggle,
}: DateVoteBreakdownProps) {
  const successColor = String(
    useCSSVariable('--color-text-success') ?? 'transparent'
  );
  const warningColor = String(
    useCSSVariable('--color-text-warning') ?? 'transparent'
  );
  const errorColor = String(
    useCSSVariable('--color-text-error') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );
  const statusColors: Record<'YES' | 'MAYBE' | 'NO', string> = {
    YES: successColor,
    MAYBE: warningColor,
    NO: errorColor,
  };
  const counts = getAvailabilityVoteCounts(date.availabilities);
  const percentages = getAvailabilityVotePercentages(counts);
  const canManage = viewerRole === 'ORGANIZER' || viewerRole === 'MODERATOR';

  return (
    <View className='mt-3 gap-2'>
      <View className='flex-row items-center'>
        {VOTE_GROUPS.map(group => (
          <View
            key={group.status}
            className='flex-1 flex-row items-center justify-center gap-1'
          >
            <Ionicons
              name={group.icon}
              size={17}
              color={statusColors[group.status]}
            />
            <Text className='text-sm font-medium text-foreground'>
              {counts[group.status.toLowerCase() as 'yes' | 'maybe' | 'no']}
            </Text>
          </View>
        ))}
        {counts.pending > 0 ? (
          <Text className='flex-1 text-center text-xs text-muted-foreground'>
            {counts.pending} pending
          </Text>
        ) : null}
      </View>

      <View
        className='h-3 w-full flex-row overflow-hidden rounded-full border border-border bg-muted'
        accessibilityLabel={`${counts.yes} yes, ${counts.maybe} maybe, ${counts.no} no, ${counts.pending} pending`}
      >
        {counts.yes > 0 ? (
          <View
            className='h-full bg-success'
            style={{ width: `${percentages.yes}%` }}
          />
        ) : null}
        {counts.maybe > 0 ? (
          <View
            className='h-full bg-warning'
            style={{ width: `${percentages.maybe}%` }}
          />
        ) : null}
        {counts.no > 0 ? (
          <View
            className='h-full bg-error'
            style={{ width: `${percentages.no}%` }}
          />
        ) : null}
      </View>

      <Pressable
        onPress={onToggle}
        accessibilityRole='button'
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? 'Hide voter breakdown' : 'View voter breakdown'
        }
        className='min-h-11 flex-row items-center justify-between rounded-button active:bg-muted'
      >
        <Text className='text-sm font-medium text-primary'>
          {expanded ? 'Hide voter breakdown' : 'View voter breakdown'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={17}
          color={mutedColor}
        />
      </Pressable>

      {expanded ? (
        <View className='gap-3 border-t border-border pt-3'>
          {VOTE_GROUPS.map(group => {
            const matching = date.availabilities.filter(
              availability => availability.status === group.status
            );

            return (
              <View key={group.status} className='gap-1'>
                <View className='flex-row items-center gap-1.5'>
                  <Ionicons
                    name={group.icon}
                    size={18}
                    color={statusColors[group.status]}
                  />
                  <Text
                    className={`text-sm font-semibold ${statusTextClass(group.status)}`}
                  >
                    {group.label} ({matching.length})
                  </Text>
                </View>

                {matching.length === 0 ? (
                  <Text className='ml-6 text-xs text-muted-foreground'>
                    No votes yet
                  </Text>
                ) : (
                  <View className='ml-6'>
                    {matching.map((availability, index) => {
                      const user = getMemberUser(availability);
                      const name = getMemberName(availability);

                      return (
                        <View
                          key={availability._id}
                          className={`flex-row items-center gap-2 py-2 ${index < matching.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <MemberAvatar
                            personId={availability.member.personId}
                            name={name}
                            src={user?.image}
                            size='sm'
                            eventMembership={{
                              membershipId: availability.member._id,
                              role: availability.member.role,
                              rsvpStatus: availability.member.rsvpStatus,
                              rsvpNote: availability.member.rsvpNote,
                              viewerRole,
                              canManage,
                            }}
                          />
                          <View className='flex-1'>
                            <Text className='text-sm font-medium text-foreground'>
                              {name}
                            </Text>
                            {availability.note ? (
                              <Text className='text-xs italic text-muted-foreground'>
                                {availability.note}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
