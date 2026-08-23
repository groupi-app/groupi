import { useState } from 'react';
import { View, Pressable, ScrollView, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { useGlobalUser } from '@/context/global-user-context';
import { signOut } from '@/lib/auth-client';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useImagePicker } from '@/hooks/use-image-picker';
import { useFileUpload } from '@/hooks/use-file-upload';
import { toast } from '@groupi/shared/platform';
import { usePushNotifications } from '@/context/push-notification-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function YouScreen() {
  const { user, person } = useGlobalUser();
  const updateProfile = useMutation(api.users.mutations.updateUserProfile);
  const { pickImage } = useImagePicker();
  const { uploadFile, isUploading } = useFileUpload();
  const { unregisterThisDevice } = usePushNotifications();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPronouns, setEditPronouns] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openEditModal() {
    setEditName((user?.name as string) ?? '');
    setEditPronouns((person?.pronouns as string) ?? '');
    setEditBio((person?.bio as string) ?? '');
    setShowEditModal(true);
  }

  async function handleSaveProfile() {
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: editName.trim() || undefined,
        pronouns: editPronouns.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      toast.success('Profile updated');
      setShowEditModal(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangeAvatar() {
    const image = await pickImage({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!image) return;

    try {
      const result = await uploadFile(
        image.uri,
        image.filename,
        image.mimeType
      );
      if (result) {
        await updateProfile({ imageStorageId: result.storageId });
        toast.success('Profile photo updated');
      }
    } catch {
      toast.error('Failed to update photo');
    }
  }

  async function handleSignOut() {
    showConfirmDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      destructive: true,
      onConfirm: async () => {
        try {
          await unregisterThisDevice();
        } catch {
          // Signing out must remain available when the device is offline.
        }
        await signOut();
        router.replace('/(auth)/sign-in');
      },
    });
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScrollView className='flex-1' contentContainerClassName='pb-8'>
        {/* Profile header */}
        <View className='items-center px-6 pt-8'>
          <Pressable onPress={handleChangeAvatar} disabled={isUploading}>
            <View className='relative'>
              <Avatar
                src={user?.image as string}
                name={user?.name as string}
                size='xl'
              />
              <View className='absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary'>
                <Ionicons name='camera' size={14} color='#ffffff' />
              </View>
            </View>
          </Pressable>

          <Text className='mt-4 text-xl font-bold text-foreground'>
            {(user?.name as string) || 'Unknown'}
          </Text>
          {user?.username ? (
            <Text className='mt-1 text-base text-muted-foreground'>
              @{user.username as string}
            </Text>
          ) : null}
          {person?.pronouns ? (
            <Text className='mt-1 text-sm text-muted-foreground'>
              {person.pronouns as string}
            </Text>
          ) : null}
          {person?.bio ? (
            <Text className='mt-2 text-center text-base text-muted-foreground'>
              {person.bio as string}
            </Text>
          ) : null}

          <Pressable
            onPress={openEditModal}
            className='mt-4 flex-row items-center gap-2 rounded-button border border-border px-4 py-2'
          >
            <Ionicons name='create-outline' size={16} color='#6b7280' />
            <Text className='text-sm font-medium text-foreground'>
              Edit Profile
            </Text>
          </Pressable>
        </View>

        {/* Menu items */}
        <View className='mt-8 px-4'>
          <MenuItem
            icon='people-outline'
            label='Friends'
            onPress={() => router.push('/friends')}
          />
          <MenuItem
            icon='settings-outline'
            label='Settings'
            onPress={() => router.push('/settings')}
          />
          <MenuItem
            icon='log-out-outline'
            label='Sign Out'
            onPress={handleSignOut}
            destructive
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className='flex-1 bg-background'>
          <View className='flex-row items-center justify-between border-b border-border px-4 py-4'>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Text className='text-base text-muted-foreground'>Cancel</Text>
            </Pressable>
            <Text className='text-lg font-semibold text-foreground'>
              Edit Profile
            </Text>
            <View className='w-14' />
          </View>

          <ScrollView
            className='flex-1 px-6 pt-6'
            keyboardShouldPersistTaps='handled'
          >
            <View className='gap-5'>
              <Input
                label='Display Name'
                placeholder='Your name'
                value={editName}
                onChangeText={setEditName}
              />
              <Input
                label='Pronouns'
                placeholder='e.g. she/her, he/him, they/them'
                value={editPronouns}
                onChangeText={setEditPronouns}
              />
              <Textarea
                label='Bio'
                placeholder='Tell people about yourself...'
                value={editBio}
                onChangeText={setEditBio}
                maxLength={500}
              />
              <Button
                onPress={handleSaveProfile}
                isLoading={isSubmitting}
                loadingText='Saving...'
              >
                Save Changes
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className='flex-row items-center gap-3 border-b border-border py-4'
    >
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? '#ef4444' : '#6b7280'}
      />
      <Text
        className={`flex-1 text-base ${destructive ? 'text-error' : 'text-foreground'}`}
      >
        {label}
      </Text>
      <Ionicons name='chevron-forward' size={18} color='#9ca3af' />
    </Pressable>
  );
}
