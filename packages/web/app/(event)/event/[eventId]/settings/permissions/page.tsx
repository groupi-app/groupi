'use client';

import { use } from 'react';
import { useEventSettingsDraft } from '@/features/event-settings';
import { SettingsPageTemplate } from '@/components/templates';
import { useEventData } from '../../context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PERMISSION_LABELS,
  PERMISSION_LEVEL_LABELS,
  type EventPermissionKey,
  type PermissionLevel,
} from '@/lib/event-permissions';

const PERMISSION_KEYS: EventPermissionKey[] = [
  'createPosts',
  'inviteMembers',
  'viewAttendeeList',
];

const PERMISSION_LEVELS: PermissionLevel[] = [
  'EVERYONE',
  'MODERATOR',
  'ORGANIZER',
];

function PermissionsSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map(i => (
        <div key={i} className='flex items-center justify-between gap-4'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-10 w-[220px]' />
        </div>
      ))}
    </div>
  );
}

export default function EventSettingsPermissionsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const { headerData, isLoading } = useEventData();
  const { values, setSection, busy } = useEventSettingsDraft();
  const permissions = values.permissions;
  const userRole = headerData?.userMembership?.role;
  const isOrganizerUser = userRole === 'ORGANIZER';
  const handlePermissionChange = (
    key: EventPermissionKey,
    value: PermissionLevel
  ) => setSection('permissions', { ...permissions, [key]: value });

  return (
    <SettingsPageTemplate
      title='Permissions'
      description='Control what members can do in this event.'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      {isLoading || !permissions ? (
        <PermissionsSkeleton />
      ) : (
        <div className='space-y-1'>
          {PERMISSION_KEYS.map(key => (
            <div
              key={key}
              className='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
            >
              <label className='text-sm font-medium'>
                {PERMISSION_LABELS[key]}
              </label>
              <Select
                value={permissions[key]}
                onValueChange={val =>
                  handlePermissionChange(key, val as PermissionLevel)
                }
                disabled={!isOrganizerUser || busy}
              >
                <SelectTrigger className='w-full sm:w-56'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {PERMISSION_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {!isOrganizerUser && (
            <p className='text-sm text-muted-foreground pt-2'>
              Only the event organizer can change permissions.
            </p>
          )}
        </div>
      )}
    </SettingsPageTemplate>
  );
}
