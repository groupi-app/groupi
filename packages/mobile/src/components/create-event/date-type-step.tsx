import { View, Pressable, ScrollView } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { GroupIcon } from '@/components/atoms/group-icon';
import { OrganizerIcon } from '@/components/atoms/organizer-icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface DateTypeStepProps {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
  onBack: () => void;
}

export function DateTypeStep({
  onSelectSingle,
  onSelectMulti,
  onBack,
}: DateTypeStepProps) {
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  return (
    <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
      <View className='gap-6'>
        <Text className='mt-6 text-center text-2xl font-bold text-foreground'>
          I would like to...
        </Text>

        <View className='gap-4'>
          {/* Choose a date */}
          <Pressable
            onPress={onSelectSingle}
            className='items-center gap-3 rounded-card border-2 border-border bg-card px-6 py-10 active:border-primary active:bg-primary/5'
          >
            <OrganizerIcon size={64} color={primaryColor} />
            <Text className='text-lg font-semibold text-foreground'>
              Choose a date myself
            </Text>
          </Pressable>

          {/* Poll attendees */}
          <Pressable
            onPress={onSelectMulti}
            className='items-center gap-3 rounded-card border-2 border-border bg-card px-6 py-10 active:border-primary active:bg-primary/5'
          >
            <GroupIcon
              size={64}
              color={primaryColor}
              secondaryColor={mutedColor}
            />
            <Text className='text-lg font-semibold text-foreground'>
              Poll Attendees
            </Text>
          </Pressable>
        </View>

        <Button variant='outline' onPress={onBack}>
          Back
        </Button>
      </View>
    </ScrollView>
  );
}
