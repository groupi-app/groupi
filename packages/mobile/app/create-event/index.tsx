import { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { EventImageUpload } from '@/components/events/event-image-upload';
import { useCreateEvent } from '@/hooks/use-events';
import { useFileUpload } from '@/hooks/use-file-upload';
import { toast } from '@groupi/shared/platform';

type DateType = 'none' | 'single' | 'multi';

interface DateOption {
  id: string;
  date: Date;
}

let nextDateId = 0;

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CreateEventScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cover image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{
    uri: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  // Date state
  const [dateType, setDateType] = useState<DateType>('none');
  const [singleDate, setSingleDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  const [showSinglePicker, setShowSinglePicker] = useState(false);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [showMultiPicker, setShowMultiPicker] = useState(false);

  const createEvent = useCreateEvent();
  const { uploadFile, isUploading } = useFileUpload();

  const isValid = title.trim().length > 0;

  function addDateOption(date: Date) {
    setDateOptions(prev => [
      ...prev,
      { id: `date-${nextDateId++}`, date },
    ]);
  }

  function removeDateOption(id: string) {
    setDateOptions(prev => prev.filter(d => d.id !== id));
  }

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      let imageStorageId: string | undefined;

      if (imageFile) {
        const result = await uploadFile(
          imageFile.uri,
          imageFile.filename,
          imageFile.mimeType,
        );
        if (result) {
          imageStorageId = result.storageId;
        }
      }

      // Build date args based on selection
      const dateArgs: Record<string, unknown> = {};
      if (dateType === 'single') {
        dateArgs.chosenDateTime = singleDate.toISOString();
      } else if (dateType === 'multi' && dateOptions.length > 0) {
        dateArgs.potentialDateTimeOptions = dateOptions.map(opt => ({
          start: opt.date.toISOString(),
        }));
      }

      const result = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        imageStorageId,
        ...dateArgs,
      });
      toast.success('Event created!');
      const newEventId = result?.eventId;
      if (newEventId) {
        router.replace(`/event/${newEventId}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create event',
      );
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
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
          <BackButton onPress={() => router.back()} />
          <Text className='text-lg font-semibold text-foreground'>
            New Event
          </Text>
          <View className='w-10' />
        </View>

        <ScrollView
          className='flex-1 px-4 pt-4'
          keyboardShouldPersistTaps='handled'
          contentContainerClassName='pb-8'
        >
          <View className='gap-5'>
            {/* Cover image */}
            <View>
              <Text className='mb-1.5 text-sm font-medium text-foreground'>
                Cover Image
              </Text>
              <EventImageUpload
                imageUri={imageUri}
                onImageSelected={(uri, filename, mimeType) => {
                  setImageUri(uri);
                  setImageFile({ uri, filename, mimeType });
                }}
                onImageRemoved={() => {
                  setImageUri(null);
                  setImageFile(null);
                }}
              />
            </View>

            <Input
              label='Event Title *'
              placeholder='Give your event a name'
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
              maxLength={2000}
            />

            <Input
              label='Location'
              placeholder='Where will it be?'
              value={location}
              onChangeText={setLocation}
            />

            {/* Date Selection */}
            <View>
              <Text className='mb-2 text-sm font-medium text-foreground'>
                When
              </Text>
              <View className='gap-2'>
                {/* No date */}
                <Pressable
                  onPress={() => setDateType('none')}
                  className={`flex-row items-center gap-3 rounded-card border-2 p-3 ${
                    dateType === 'none'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <Ionicons
                    name='calendar-outline'
                    size={20}
                    color={dateType === 'none' ? '#8b00b8' : '#9ca3af'}
                  />
                  <Text
                    className={`text-base ${dateType === 'none' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    Decide later
                  </Text>
                </Pressable>

                {/* Single date */}
                <Pressable
                  onPress={() => setDateType('single')}
                  className={`flex-row items-center gap-3 rounded-card border-2 p-3 ${
                    dateType === 'single'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <Ionicons
                    name='calendar'
                    size={20}
                    color={dateType === 'single' ? '#8b00b8' : '#9ca3af'}
                  />
                  <Text
                    className={`text-base ${dateType === 'single' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    Set a date
                  </Text>
                </Pressable>

                {/* Multi date (voting) */}
                <Pressable
                  onPress={() => setDateType('multi')}
                  className={`flex-row items-center gap-3 rounded-card border-2 p-3 ${
                    dateType === 'multi'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <Ionicons
                    name='list'
                    size={20}
                    color={dateType === 'multi' ? '#8b00b8' : '#9ca3af'}
                  />
                  <Text
                    className={`text-base ${dateType === 'multi' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    Let members vote on dates
                  </Text>
                </Pressable>
              </View>

              {/* Single date picker */}
              {dateType === 'single' ? (
                <View className='mt-3'>
                  <Pressable
                    onPress={() => setShowSinglePicker(true)}
                    className='flex-row items-center gap-2 rounded-input border border-border bg-card px-4 py-3'
                  >
                    <Ionicons
                      name='calendar-outline'
                      size={18}
                      color='#6b7280'
                    />
                    <Text className='flex-1 text-base text-foreground'>
                      {formatDate(singleDate)}
                    </Text>
                    <Ionicons
                      name='chevron-down'
                      size={16}
                      color='#9ca3af'
                    />
                  </Pressable>
                  {showSinglePicker ? (
                    <View className='mt-2'>
                      <DateTimePicker
                        value={singleDate}
                        mode='datetime'
                        display='spinner'
                        minimumDate={new Date()}
                        onChange={(_, date) => {
                          if (date) setSingleDate(date);
                          if (Platform.OS === 'android')
                            setShowSinglePicker(false);
                        }}
                      />
                      {Platform.OS === 'ios' ? (
                        <Pressable
                          onPress={() => setShowSinglePicker(false)}
                          className='mt-1 items-center py-2'
                        >
                          <Text className='text-sm font-medium text-primary'>
                            Done
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Multi date options */}
              {dateType === 'multi' ? (
                <View className='mt-3 gap-2'>
                  {dateOptions.map(opt => (
                    <View
                      key={opt.id}
                      className='flex-row items-center gap-2 rounded-input border border-border bg-card px-4 py-3'
                    >
                      <Ionicons
                        name='calendar-outline'
                        size={16}
                        color='#6b7280'
                      />
                      <Text className='flex-1 text-base text-foreground'>
                        {formatDate(opt.date)}
                      </Text>
                      <Pressable onPress={() => removeDateOption(opt.id)}>
                        <Ionicons
                          name='close-circle'
                          size={20}
                          color='#ef4444'
                        />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => setShowMultiPicker(true)}
                    className='flex-row items-center gap-2 rounded-input border border-dashed border-border px-4 py-3'
                  >
                    <Ionicons name='add-circle-outline' size={20} color='#8b00b8' />
                    <Text className='text-base font-medium text-primary'>
                      Add date option
                    </Text>
                  </Pressable>

                  {showMultiPicker ? (
                    <View className='mt-1'>
                      <DateTimePicker
                        value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                        mode='datetime'
                        display='spinner'
                        minimumDate={new Date()}
                        onChange={(_, date) => {
                          if (date) addDateOption(date);
                          setShowMultiPicker(false);
                        }}
                      />
                      {Platform.OS === 'ios' ? (
                        <Pressable
                          onPress={() => setShowMultiPicker(false)}
                          className='mt-1 items-center py-2'
                        >
                          <Text className='text-sm font-medium text-primary'>
                            Done
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting || isUploading}
              loadingText={isUploading ? 'Uploading image...' : 'Creating...'}
              disabled={!isValid}
              className='mt-4'
            >
              Create Event
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
