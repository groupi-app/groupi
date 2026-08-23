import { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';

import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { EventImageUpload } from '@/components/events/event-image-upload';
import { LoadingState } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { useEventHeader, useUpdateEvent } from '@/hooks/use-events';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { toast } from '@groupi/shared/platform';

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const headerData = useEventHeader(eventId as never);
  const updateEvent = useUpdateEvent();
  const { uploadFile, isUploading } = useFileUpload();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Image state
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<{
    uri: string;
    filename: string;
    mimeType: string;
  } | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const event = headerData?.event ?? headerData;

  // Pre-populate form
  useEffect(() => {
    if (event && !initialized) {
      setTitle(event.title ?? '');
      setDescription(event.description ?? '');
      setLocation(event.location ?? '');
      setExistingImageUrl(event.imageUrl ?? null);
      setInitialized(true);
    }
  }, [event, initialized]);

  // Unsaved changes guard
  const hasChanges =
    initialized &&
    (title !== (event?.title ?? '') ||
      description !== (event?.description ?? '') ||
      location !== (event?.location ?? '') ||
      newImageUri !== null ||
      removeExistingImage);
  useUnsavedChanges(hasChanges);

  if (headerData === undefined) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Event
          </Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Event
          </Text>
        </View>
        <EmptyState
          icon='calendar-outline'
          title='Event not found'
          description='This event may have been deleted or you may no longer have permission to edit it.'
        />
      </SafeAreaView>
    );
  }

  const isValid = title.trim().length > 0;

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      let imageStorageId: string | null | undefined;

      // Upload new image if selected
      if (newImageFile) {
        const result = await uploadFile(
          newImageFile.uri,
          newImageFile.filename,
          newImageFile.mimeType
        );
        if (result) {
          imageStorageId = result.storageId;
        }
      } else if (removeExistingImage) {
        imageStorageId = null; // Signal to clear the image
      }

      await updateEvent({
        eventId,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        ...(imageStorageId !== undefined ? { imageStorageId } : {}),
      });
      toast.success('Event updated!');
      router.back();
    } catch {
      toast.error('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Event
          </Text>
        </View>

        <ScrollView
          className='flex-1 px-4'
          keyboardShouldPersistTaps='handled'
          contentContainerClassName='pb-8'
        >
          <View className='gap-5 pt-4'>
            {/* Cover image */}
            <View>
              <Text className='mb-1.5 text-sm font-medium text-foreground'>
                Cover Image
              </Text>
              <EventImageUpload
                imageUri={newImageUri}
                existingImageUrl={removeExistingImage ? null : existingImageUrl}
                onImageSelected={(uri, filename, mimeType) => {
                  setNewImageUri(uri);
                  setNewImageFile({ uri, filename, mimeType });
                  setRemoveExistingImage(false);
                }}
                onImageRemoved={() => {
                  setNewImageUri(null);
                  setNewImageFile(null);
                  setRemoveExistingImage(true);
                }}
              />
            </View>

            <Input
              label='Event Title *'
              placeholder='Event title'
              value={title}
              onChangeText={setTitle}
              error={
                title.length > 0 && title.trim().length === 0
                  ? 'Title is required'
                  : undefined
              }
            />

            <Textarea
              label='Description'
              placeholder="What's this event about?"
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
            />

            <Input
              label='Location'
              placeholder='Where will it be?'
              value={location}
              onChangeText={setLocation}
            />

            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting || isUploading}
              loadingText={isUploading ? 'Uploading image...' : 'Saving...'}
              disabled={!isValid}
              className='mt-4'
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
