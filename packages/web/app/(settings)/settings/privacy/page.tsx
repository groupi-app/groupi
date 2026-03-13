'use client';

import { useState } from 'react';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsPageTemplate } from '@/components/templates';
import { EmptyState } from '@/components/molecules';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Users, Calendar, ShieldOff } from 'lucide-react';
import {
  usePrivacySettings,
  useSavePrivacySettings,
  FriendRequestPolicy,
  EventInvitePolicy,
} from '@/hooks/convex/use-settings';
import { useBlockedUsers, useUnblockUser } from '@/hooks/convex/use-friends';

type BlockedUser = {
  personId: Id<'persons'>;
  name: string | null;
  username: string | null;
  image: string | null;
  blockedAt: number;
};
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';

export default function PrivacySettings() {
  return (
    <>
      <AuthLoading>
        <SettingsPageTemplate
          title='Privacy'
          isLoading
          loadingContent={<PrivacySettingsSkeleton />}
        >
          <div />
        </SettingsPageTemplate>
      </AuthLoading>

      <Unauthenticated>
        <SettingsPageTemplate title='Privacy'>
          <EmptyState
            icon={<Lock className='h-10 w-10' />}
            message='Authentication Required'
            description='Please sign in to access your privacy settings.'
            action={
              <Link href='/sign-in'>
                <Button>Sign In</Button>
              </Link>
            }
          />
        </SettingsPageTemplate>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedPrivacySettings />
      </Authenticated>
    </>
  );
}

function AuthenticatedPrivacySettings() {
  const settings = usePrivacySettings();
  const saveSettings = useSavePrivacySettings();
  const blockedUsers = useBlockedUsers() as BlockedUser[] | undefined;
  const unblockUser = useUnblockUser();

  // Track overrides - null means user hasn't changed the value yet
  const [friendPolicyOverride, setFriendPolicyOverride] =
    useState<FriendRequestPolicy | null>(null);
  const [invitePolicyOverride, setInvitePolicyOverride] =
    useState<EventInvitePolicy | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Derive current values: use override if set, otherwise server value
  const friendPolicy =
    friendPolicyOverride ?? settings?.allowFriendRequestsFrom ?? 'EVERYONE';
  const invitePolicy =
    invitePolicyOverride ?? settings?.allowEventInvitesFrom ?? 'EVERYONE';

  // Derive hasChanges from overrides vs server values
  const hasChanges =
    (friendPolicyOverride !== null &&
      friendPolicyOverride !== settings?.allowFriendRequestsFrom) ||
    (invitePolicyOverride !== null &&
      invitePolicyOverride !== settings?.allowEventInvitesFrom);

  if (settings === undefined || blockedUsers === undefined) {
    return (
      <SettingsPageTemplate
        title='Privacy'
        description='Control who can interact with you.'
        isLoading
        loadingContent={<PrivacySettingsSkeleton />}
      >
        <div />
      </SettingsPageTemplate>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettings({
      allowFriendRequestsFrom: friendPolicy,
      allowEventInvitesFrom: invitePolicy,
    });
    setIsSaving(false);
    // Reset overrides since server now has these values
    setFriendPolicyOverride(null);
    setInvitePolicyOverride(null);
  };

  const handleUnblock = async (personId: Id<'persons'>) => {
    await unblockUser(personId);
  };

  return (
    <SettingsPageTemplate
      title='Privacy'
      description='Control who can interact with you.'
    >
      <div className='space-y-8'>
        {/* Friend Requests */}
        <section className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Users className='size-5 text-primary' />
            <h2 className='text-lg font-semibold'>Friend Requests</h2>
          </div>
          <p className='text-sm text-muted-foreground'>
            Choose who can send you friend requests.
          </p>
          <Select
            value={friendPolicy}
            onValueChange={v =>
              setFriendPolicyOverride(v as FriendRequestPolicy)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='EVERYONE'>Everyone</SelectItem>
              <SelectItem value='EVENT_MEMBERS'>People in my events</SelectItem>
              <SelectItem value='NO_ONE'>No one</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Event Invites */}
        <section className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Calendar className='size-5 text-primary' />
            <h2 className='text-lg font-semibold'>Event Invites</h2>
          </div>
          <p className='text-sm text-muted-foreground'>
            Choose who can send you event invites.
          </p>
          <Select
            value={invitePolicy}
            onValueChange={v => setInvitePolicyOverride(v as EventInvitePolicy)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='EVERYONE'>Everyone</SelectItem>
              <SelectItem value='EVENT_MEMBERS'>People in my events</SelectItem>
              <SelectItem value='FRIENDS'>Friends only</SelectItem>
              <SelectItem value='NO_ONE'>No one</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          isLoading={isSaving}
          className='w-full'
        >
          Save Changes
        </Button>

        {/* Blocked Users */}
        <section className='space-y-3 border-t pt-6'>
          <div className='flex items-center gap-2'>
            <ShieldOff className='size-5 text-destructive' />
            <h2 className='text-lg font-semibold'>Blocked Users</h2>
          </div>
          <p className='text-sm text-muted-foreground'>
            Blocked users cannot send you friend requests or event invites.
          </p>

          {blockedUsers.length === 0 ? (
            <p className='text-sm text-muted-foreground py-4 text-center'>
              You haven&apos;t blocked anyone.
            </p>
          ) : (
            <div className='space-y-2'>
              {blockedUsers.map(user => (
                <div
                  key={user.personId}
                  className='flex items-center gap-3 p-3 rounded-card bg-card border border-border'
                >
                  <Avatar className='size-10'>
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>
                      {getInitialsFromName(user.name, user.username || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium truncate'>
                      {user.name || 'Unknown'}
                    </div>
                    {user.username && (
                      <div className='text-sm text-muted-foreground truncate'>
                        @{user.username}
                      </div>
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleUnblock(user.personId)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </SettingsPageTemplate>
  );
}

function PrivacySettingsSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-64' />
        <Skeleton className='h-10 w-full' />
      </div>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-64' />
        <Skeleton className='h-10 w-full' />
      </div>
      <Skeleton className='h-10 w-full' />
    </div>
  );
}
