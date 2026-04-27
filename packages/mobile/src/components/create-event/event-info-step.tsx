import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { EventImageUpload } from '@/components/events/event-image-upload';
import {
  useCreateEventForm,
  type EventVisibility,
} from '@/context/create-event-context';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS: {
  value: EventVisibility;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    value: 'PRIVATE',
    label: 'Private',
    icon: 'lock-closed',
    description: 'Only invited members can see this event',
  },
  {
    value: 'FRIENDS',
    label: 'Friends',
    icon: 'people',
    description: 'Friends of members can discover this event',
  },
  {
    value: 'PUBLIC',
    label: 'Public',
    icon: 'globe',
    description: 'Anyone can discover and join this event',
  },
];

interface EventInfoStepProps {
  onNext: () => void;
}

export function EventInfoStep({ onNext }: EventInfoStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const { title, description, location, visibility, imageUri } = formState;

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
                updateFormState({ imageUri: null, imageFile: null });
              }}
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
            <View className='gap-2'>
              {VISIBILITY_OPTIONS.map(opt => {
                const isSelected = visibility === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateFormState({ visibility: opt.value })}
                    className={cn(
                      'flex-row items-center gap-3 rounded-card border p-3',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? '#8b00b8' : '#9ca3af'}
                    />
                    <View className='flex-1'>
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          isSelected
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {opt.label}
                      </Text>
                      <Text className='text-xs text-muted-foreground'>
                        {opt.description}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name='checkmark-circle'
                        size={20}
                        color='#8b00b8'
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button onPress={onNext} disabled={!isValid} className='mt-2'>
            Next
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
