import { GroupOwnershipTransfer } from './group-ownership-transfer';
import { GroupAnnouncementComposer } from './group-announcement-composer';
import { useState } from 'react';
import { Image, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useGroup,
  useGroupLanding,
  useUpdateGroup,
  useDeleteGroup,
} from '@/hooks/use-groups';
import { useGlobalUser } from '@/context/global-user-context';
import { getPublicGroupUrl } from '@/lib/public-urls';
import { GroupLandingInvitation } from './group-invitation-panels';
import { GroupLeaveControl } from './group-leave-control';
import { GroupJoiningQuestionnairePrompt } from './group-questionnaire';
import { GroupApplicationSettings } from './group-application-settings';
import { GroupEventSharingPolicy } from './group-event-sharing-policy';
import { GroupForm } from './group-form';

export function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = groupId as Id<'groups'>;
  const group = useGroup(id);
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setDeleting(true);
    setError('');
    try {
      await deleteGroup({ groupId: id });
      router.replace(`/g/${id}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not delete Group. Try again.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='border-b border-border px-4 py-3'>
        <BackButton />
      </View>
      <ScrollView contentContainerClassName='gap-4 p-4'>
        {group === undefined ? (
          <Text className='text-muted-foreground'>Loading Group…</Text>
        ) : !group ? (
          <Text className='text-foreground'>
            Group unavailable. It may have been deleted or you may not have
            access.
          </Text>
        ) : (
          <>
            <GroupJoiningQuestionnairePrompt groupId={id} />
            <Text
              accessibilityRole='header'
              className='text-2xl font-bold text-foreground'
            >
              {group.name}
            </Text>
            {group.image ? (
              <Image
                source={{ uri: group.image }}
                accessibilityLabel={`${group.name} image`}
                className='h-48 w-full rounded-card'
              />
            ) : null}
            {group.description ? (
              <Text className='text-foreground'>{group.description}</Text>
            ) : null}
            <Text className='text-muted-foreground'>
              Your role: {group.viewerRole.toLowerCase()}
            </Text>
            <Text className='text-muted-foreground'>
              {group.memberCount}{' '}
              {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
            <Text className='text-muted-foreground'>
              Owner ID: {group.ownerId}
            </Text>
            <Button
              variant='outline'
              onPress={async () => {
                try {
                  await Share.share({ message: getPublicGroupUrl(id) });
                } catch {
                  setError('Could not share Group link. Try again.');
                }
              }}
            >
              Share Group link
            </Button>
            <Button
              variant='outline'
              accessibilityLabel={
                group.joiningQuestionnaire?.canAccessMemberContent === false &&
                !group.canManageMembers
                  ? 'Complete required Group onboarding'
                  : 'View Group members'
              }
              onPress={() =>
                router.push(
                  group.joiningQuestionnaire?.canAccessMemberContent ===
                    false && !group.canManageMembers
                    ? `/groups/${id}/questionnaire`
                    : `/groups/${id}/members`
                )
              }
            >
              {group.joiningQuestionnaire?.canAccessMemberContent === false &&
              !group.canManageMembers
                ? 'Complete required onboarding'
                : 'View members'}
            </Button>
            {group.canManageInvitations ? (
              <Button
                variant='outline'
                accessibilityLabel='Manage Group invitations'
                onPress={() => router.push(`/groups/${id}/invitations`)}
              >
                Manage invitations
              </Button>
            ) : null}
            {group.canManageMembers ? (
              <Button
                variant='outline'
                accessibilityLabel='Manage Group bans'
                onPress={() => router.push(`/groups/${id}/bans`)}
              >
                Manage bans
              </Button>
            ) : null}
            <GroupOwnershipTransfer groupId={id} />
            <Button
              accessibilityLabel='Group polls'
              variant='outline'
              onPress={() => router.push(`/groups/${id}/polls`)}
            >
              Polls and poll settings
            </Button>
            <Button
              accessibilityLabel='Create Group poll'
              variant='outline'
              onPress={() => router.push(`/groups/${id}/polls/create`)}
            >
              Create poll
            </Button>
            <Button
              accessibilityLabel='Group forms'
              variant='outline'
              onPress={() => router.push(`/groups/${id}/forms`)}
            >
              Forms
            </Button>
            {group.viewerRole === 'OWNER' ? (
              <Button
                accessibilityLabel='Group form policy'
                variant='outline'
                onPress={() => router.push(`/groups/${id}/forms/policy`)}
              >
                Forms policy
              </Button>
            ) : null}
            <Button
              variant='outline'
              accessibilityLabel='My joining questionnaire'
              onPress={() => router.push(`/groups/${id}/questionnaire`)}
            >
              My joining questionnaire
            </Button>
            {group.canManageMembers ? (
              <Button
                accessibilityLabel='Review Group applications'
                variant='outline'
                onPress={() => router.push(`/groups/${id}/applications`)}
              >
                Review applications
              </Button>
            ) : null}
            <Button
              accessibilityLabel='My Group application history'
              variant='outline'
              onPress={() => router.push(`/groups/${id}/apply`)}
            >
              My application history
            </Button>
            {group.canManageRoles ? (
              <GroupApplicationSettings
                groupId={id}
                applicationsEnabled={group.applicationsEnabled}
                questions={group.applicationQuestions}
              />
            ) : null}
            {group.viewerRole !== 'MEMBER' && (
              <GroupAnnouncementComposer groupId={id} />
            )}
            <Button
              accessibilityLabel='View Group shared Events'
              variant='outline'
              disabled={
                group.joiningQuestionnaire?.canAccessMemberContent === false
              }
              onPress={() => router.push(`/groups/${id}/events`)}
            >
              Shared Event logistics
            </Button>
            {group.canManageRoles ? (
              <GroupEventSharingPolicy
                groupId={id}
                policy={group.eventSharingPolicy}
              />
            ) : null}
            <GroupLeaveControl groupId={id} canLeave={group.canLeave} />
            {group.canManageIdentity ? (
              editing ? (
                <GroupForm
                  initial={group}
                  onCancel={() => setEditing(false)}
                  onSave={async identity => {
                    await updateGroup({
                      groupId: id,
                      name: identity.name,
                      description: identity.description || null,
                      image: identity.image || null,
                    });
                    setEditing(false);
                  }}
                />
              ) : (
                <>
                  <Button onPress={() => setEditing(true)} disabled={deleting}>
                    Edit Group
                  </Button>
                  <Button
                    variant='destructive'
                    disabled={deleting}
                    isLoading={deleting}
                    onPress={() =>
                      showConfirmDialog({
                        title: 'Delete Group',
                        message: `Permanently retire ${group.name} and remove its Group data and audience grants? Independent Events, invitations, memberships and RSVP remain unchanged. This cannot be undone.`,
                        confirmLabel: 'Delete Group',
                        destructive: true,
                        onConfirm: remove,
                      })
                    }
                  >
                    Delete Group
                  </Button>
                </>
              )
            ) : null}
          </>
        )}
        {error ? (
          <Text accessibilityRole='alert' className='text-destructive'>
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export function GroupLandingScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroupLanding(groupId as Id<'groups'>);
  const { isAuthenticated } = useGlobalUser();

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScrollView contentContainerClassName='gap-4 p-6'>
        <Text className='text-sm text-muted-foreground'>Group</Text>
        {group === undefined ? (
          <Text className='text-muted-foreground'>Loading Group…</Text>
        ) : !group ? (
          <Text className='text-foreground'>
            Group unavailable. This link may no longer be valid.
          </Text>
        ) : (
          <>
            <Text
              accessibilityRole='header'
              className='text-2xl font-bold text-foreground'
            >
              {group.name}
            </Text>
            {group.image ? (
              <Image
                source={{ uri: group.image }}
                accessibilityLabel={`${group.name} image`}
                className='h-48 w-full rounded-card'
              />
            ) : null}
            {group.description ? (
              <Text className='text-foreground'>{group.description}</Text>
            ) : null}
            <Button
              accessibilityLabel='Apply to Group or view private status'
              onPress={() =>
                isAuthenticated
                  ? router.push(`/groups/${groupId}/apply`)
                  : router.push({
                      pathname: '/(auth)/sign-in',
                      params: { returnTo: `/groups/${groupId}/apply` },
                    })
              }
            >
              Apply or view my application
            </Button>
            {isAuthenticated ? (
              <>
                <GroupLandingInvitation groupId={groupId as Id<'groups'>} />
                <Button
                  variant='outline'
                  accessibilityLabel='My retained questionnaire records'
                  onPress={() =>
                    router.push(`/groups/${groupId}/questionnaire`)
                  }
                >
                  My questionnaire records, if previously submitted
                </Button>
              </>
            ) : null}
            {isAuthenticated ? (
              <Button
                variant='outline'
                onPress={() => router.push(`/groups/${groupId}`)}
              >
                View Group
              </Button>
            ) : (
              <Button
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/sign-in',
                    params: { returnTo: `/g/${groupId}` },
                  })
                }
              >
                Sign in or sign up
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
