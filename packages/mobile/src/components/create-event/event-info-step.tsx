import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { EventImageUpload } from '@/components/events/event-image-upload';
import { EventVisibilitySelector } from '@/components/events/event-visibility-selector';
import { useCreateEventForm } from '@/context/create-event-context';

interface EventInfoStepProps {
  onNext: () => void;
}

export function EventInfoStep({ onNext }: EventInfoStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const {
    title,
    description,
    location,
    visibility,
    imageUri,
    imageFocalPoint,
  } = formState;

  const isValid = title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className='flex-1'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={120}
    >
      <ScrollView
        className='flex-1 px-4'
        keyboardShouldPersistTaps='handled'
        contentContainerClassName='pb-8'
      >
        <View className='gap-5'>
          <Text className='mt-2 text-2xl font-bold text-foreground'>
            Event Details
          </Text>
          <Text className='text-sm text-muted-foreground'>
            Give your event a name and tell people what it&apos;s about.
          </Text>

          {/* Cover image */}
          <View>
            <Text className='mb-1.5 text-sm font-medium text-foreground'>
              Cover Image
            </Text>
            <EventImageUpload
              imageUri={imageUri}
              onImageSelected={(uri, filename, mimeType) => {
                updateFormState({
                  imageUri: uri,
                  imageFile: { uri, filename, mimeType },
                });
              }}
              onImageRemoved={() => {
                updateFormState({
                  imageUri: null,
                  imageFile: null,
                  imageFocalPoint: null,
                });
              }}
              focalPoint={imageFocalPoint}
              onFocalPointChange={focalPoint =>
                updateFormState({ imageFocalPoint: focalPoint })
              }
            />
          </View>

          <Input
            label='Event Title *'
            placeholder='Give your event a name'
            value={title}
            onChangeText={value => updateFormState({ title: value })}
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
            onChangeText={value => updateFormState({ description: value })}
            maxLength={1000}
          />

          <Input
            label='Location'
            placeholder='Where will it be?'
            value={location}
            onChangeText={value => updateFormState({ location: value })}
          />

          {/* Visibility selector */}
          <View>
            <Text className='mb-1.5 text-sm font-medium text-foreground'>
              Visibility
            </Text>
            <EventVisibilitySelector
              value={visibility}
              onChange={value => updateFormState({ visibility: value })}
            />
          </View>

          <Button onPress={onNext} disabled={!isValid} className='mt-2'>
            Next
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
