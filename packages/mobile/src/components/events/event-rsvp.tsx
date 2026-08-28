import { useState } from 'react';
import { View, Pressable, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { useUpdateRSVP } from '@/hooks/use-events';
import { toast } from '@groupi/shared/platform';
import { useCSSVariable } from 'uniwind';

interface EventRsvpProps {
  eventId: string;
  currentStatus: string;
  currentNote?: string;
  isOrganizer: boolean;
}

type RsvpStatus = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

const statusConfig: Record<
  RsvpStatus,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  YES: {
    label: 'Going',
    icon: 'checkmark-circle',
  },
  MAYBE: {
    label: 'Maybe',
    icon: 'help-circle',
  },
  NO: {
    label: "Can't Go",
    icon: 'close-circle',
  },
  PENDING: {
    label: 'RSVP Pending',
    icon: 'time',
  },
};

export function EventRsvp({
  eventId,
  currentStatus,
  currentNote,
  isOrganizer,
}: EventRsvpProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RsvpStatus>(
    currentStatus as RsvpStatus
  );
  const [note, setNote] = useState(currentNote ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateRSVP = useUpdateRSVP();
  const statusColors: Record<RsvpStatus, string> = {
    YES: String(useCSSVariable('--color-text-success') ?? ''),
    MAYBE: String(useCSSVariable('--color-text-warning') ?? ''),
    NO: String(useCSSVariable('--color-text-error') ?? ''),
    PENDING: String(useCSSVariable('--color-text-info') ?? ''),
  };
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  // Organizers don't need to RSVP
  if (isOrganizer) return null;

  const config =
    statusConfig[currentStatus as RsvpStatus] ?? statusConfig.PENDING;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await updateRSVP({
        eventId,
        rsvpStatus: selectedStatus,
        rsvpNote: note.trim() || undefined,
      });
      toast.success('RSVP updated!');
      setShowModal(false);
    } catch {
      toast.error('Failed to update RSVP');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setSelectedStatus(currentStatus as RsvpStatus);
          setNote(currentNote ?? '');
          setShowModal(true);
        }}
        className='mt-4 min-h-11 flex-row items-center gap-2 rounded-button bg-card px-4 py-3'
        accessibilityRole='button'
        accessibilityLabel={`RSVP: ${config.label}`}
        accessibilityHint='Opens RSVP options'
      >
        <Ionicons
          name={config.icon}
          size={20}
          color={statusColors[currentStatus as RsvpStatus] ?? mutedColor}
        />
        <Text className='text-base font-semibold text-foreground'>
          {config.label}
        </Text>
        <Ionicons name='chevron-down' size={16} color={mutedColor} />
      </Pressable>

      <Modal
        visible={showModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowModal(false)}
      >
        <View className='flex-1 bg-background'>
          <View className='flex-row items-center justify-between border-b border-border px-4 py-4'>
            <Pressable
              onPress={() => setShowModal(false)}
              className='min-h-11 min-w-14 justify-center'
              accessibilityRole='button'
              accessibilityLabel='Cancel RSVP changes'
            >
              <Text className='text-base text-muted-foreground'>Cancel</Text>
            </Pressable>
            <Text className='text-lg font-semibold text-foreground'>RSVP</Text>
            <View className='w-14' />
          </View>

          <ScrollView
            className='flex-1 px-6 pt-6'
            keyboardShouldPersistTaps='handled'
          >
            <Text className='mb-4 text-base text-muted-foreground'>
              Will you be attending?
            </Text>

            <View className='gap-3'>
              {(['YES', 'MAYBE', 'NO'] as const).map(status => {
                const cfg = statusConfig[status];
                const isSelected = selectedStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setSelectedStatus(status)}
                    accessibilityRole='radio'
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={cfg.label}
                    className={`flex-row items-center gap-3 rounded-card border-2 p-4 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Ionicons
                      name={cfg.icon}
                      size={24}
                      color={isSelected ? statusColors[status] : mutedColor}
                    />
                    <Text
                      className={`text-base font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className='mt-6'>
              <Textarea
                label='Note (optional)'
                placeholder='Add a message...'
                value={note}
                onChangeText={setNote}
                maxLength={200}
              />
            </View>

            <View className='mt-6'>
              <Button
                onPress={handleSubmit}
                isLoading={isSubmitting}
                loadingText='Saving...'
                disabled={selectedStatus === 'PENDING'}
              >
                Save RSVP
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
