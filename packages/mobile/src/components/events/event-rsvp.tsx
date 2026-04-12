import { useState } from 'react';
import { View, Pressable, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { useUpdateRSVP } from '@/hooks/use-events';
import { toast } from '@groupi/shared/platform';

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
    color: string;
    bgClass: string;
  }
> = {
  YES: {
    label: 'Going',
    icon: 'checkmark-circle',
    color: '#22c55e',
    bgClass: 'bg-success',
  },
  MAYBE: {
    label: 'Maybe',
    icon: 'help-circle',
    color: '#f59e0b',
    bgClass: 'bg-warning',
  },
  NO: {
    label: "Can't Go",
    icon: 'close-circle',
    color: '#ef4444',
    bgClass: 'bg-error',
  },
  PENDING: {
    label: 'RSVP Pending',
    icon: 'time',
    color: '#6366f1',
    bgClass: 'bg-info',
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
        className='mt-4 flex-row items-center gap-2 rounded-button bg-card px-4 py-3'
      >
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text className='text-base font-semibold text-foreground'>
          {config.label}
        </Text>
        <Ionicons name='chevron-down' size={16} color='#9ca3af' />
      </Pressable>

      <Modal
        visible={showModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowModal(false)}
      >
        <View className='flex-1 bg-background'>
          <View className='flex-row items-center justify-between border-b border-border px-4 py-4'>
            <Pressable onPress={() => setShowModal(false)}>
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
                    className={`flex-row items-center gap-3 rounded-card border-2 p-4 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Ionicons
                      name={cfg.icon}
                      size={24}
                      color={isSelected ? cfg.color : '#9ca3af'}
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
