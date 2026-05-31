'use client';

import { use, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { api } = require('@/convex/_generated/api') as { api: any };
  const updatePermissions = useMutation(
    api.events.mutations.updateEventPermissions
  );

  const permissions = headerData?.permissions;
  const userRole = headerData?.userMembership?.role;
  const isOrganizerUser = userRole === 'ORGANIZER';

  const handlePermissionChange = useCallback(
    async (key: EventPermissionKey, value: PermissionLevel) => {
      try {
        const args = {
          eventId: eventId as Id<'events'>,
          createPosts: key === 'createPosts' ? value : undefined,
          inviteMembers: key === 'inviteMembers' ? value : undefined,
          viewAttendeeList: key === 'viewAttendeeList' ? value : undefined,
        };
        await updatePermissions(args);
        toast.success('Permission updated');
      } catch {
        toast.error('Failed to update permission');
      }
    },
    [updatePermissions, eventId]
  );

  return (
    <SettingsPageTemplate
      title='Permissions'
      description='Control what members can do in this event.'
      backHref={`/event/${eventId}/settings`}
      maxWidth='md'
    >
      {isLoading || !permissions ? (
        <PermissionsSkeleton />
      ) : (
        <div className='space-y-1'>
          {PERMISSION_KEYS.map(key => (
            <div
              key={key}
              className='flex items-center justify-between gap-4 py-3'
            >
              <label className='text-sm font-medium'>
                {PERMISSION_LABELS[key]}
              </label>
              <Select
                value={permissions[key]}
                onValueChange={val =>
                  handlePermissionChange(key, val as PermissionLevel)
                }
                disabled={!isOrganizerUser}
              >
                <SelectTrigger className='w-[220px]'>
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
