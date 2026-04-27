import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { SettingsScreenTemplate } from '@/components/templates';

const CHANGELOG_ENTRIES = [
  {
    version: '0.2.0',
    date: '2026-04-14',
    changes: [
      {
        type: 'added' as const,
        items: [
          'Event filtering by Upcoming, Hosting, and Attended tabs',
          'Event sorting by activity, date, or title',
          'Event muting with bell indicator',
          'Long-press context actions on event cards',
          'Discover tab for public and friends-visible events',
          'Pending event invites screen',
          'Privacy settings (friend request and invite controls)',
          'Blocked users management',
          'Enhanced notification filters (All/Unread tabs)',
          'Post editing and reply editing',
          'Member role management (promote/demote/kick/ban)',
          'Availability summary with response counts',
          'Batch availability selection (All Yes/Maybe/No)',
          'Date selection for organizers',
          'Online/offline presence tracking',
          'Typing indicators in post threads',
          'Rich text content display for posts',
          'Report users, events, and posts',
          'Unsaved changes navigation guard',
          'Sent friend requests tab with cancel',
          'Friend suggestions from shared events',
          'Add-on system (reminders, questionnaire, bring list)',
        ],
      },
      {
        type: 'improved' as const,
        items: [
          'Enhanced notification settings with per-category controls',
          'Profile view with report and block options',
          'Cancel sent friend request from profile',
          'Badge count capped at 99+',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-01',
    changes: [
      {
        type: 'added' as const,
        items: [
          'Initial release',
          'Event creation and management',
          'Post and reply system',
          'Friend management',
          'Notifications',
          'Theme selection',
          'Profile and account settings',
        ],
      },
    ],
  },
];

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  added: { label: 'Added', className: 'bg-success/15 text-success' },
  improved: { label: 'Improved', className: 'bg-info/15 text-info' },
  fixed: { label: 'Fixed', className: 'bg-warning/15 text-warning' },
  removed: { label: 'Removed', className: 'bg-error/15 text-error' },
};

export default function ChangelogScreen() {
  return (
    <SettingsScreenTemplate
      title="What's New"
      description='Recent updates and improvements'
    >
      {CHANGELOG_ENTRIES.map(entry => (
        <View key={entry.version} className='mb-6'>
          <View className='flex-row items-center gap-3'>
            <Text className='text-lg font-bold text-foreground'>
              v{entry.version}
            </Text>
            <Text className='text-sm text-muted-foreground'>{entry.date}</Text>
          </View>

          {entry.changes.map((group, gi) => {
            const typeConfig = TYPE_LABELS[group.type] ?? TYPE_LABELS.added;
            return (
              <View key={gi} className='mt-3'>
                <View
                  className={`self-start rounded-badge px-2.5 py-0.5 ${typeConfig.className}`}
                >
                  <Text
                    className={`text-xs font-semibold ${typeConfig.className}`}
                  >
                    {typeConfig.label}
                  </Text>
                </View>
                <View className='mt-2 gap-1.5'>
                  {group.items.map((item, ii) => (
                    <View key={ii} className='flex-row gap-2 pl-1'>
                      <Text className='text-sm text-muted-foreground'>•</Text>
                      <Text className='flex-1 text-sm text-foreground'>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </SettingsScreenTemplate>
  );
}
