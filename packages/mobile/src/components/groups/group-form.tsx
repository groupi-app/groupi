import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GroupFormProps {
  initial?: { name: string; description?: string; image?: string };
  onSave: (identity: {
    name: string;
    description: string;
    image: string;
  }) => Promise<unknown>;
  onCancel?: () => void;
}

export function GroupForm({ initial, onSave, onCancel }: GroupFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const trimmedName = name.trim();
    const trimmedImage = image.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setError('Use a Group name of 1–100 characters.');
      return;
    }
    if (description.length > 2000) {
      setError('Description must be at most 2,000 characters.');
      return;
    }
    if (trimmedImage) {
      try {
        const url = new URL(trimmedImage);
        if (
          url.protocol !== 'https:' ||
          url.username ||
          url.password ||
          trimmedImage.length > 2048
        )
          throw new Error();
      } catch {
        setError('Use an HTTPS image URL of at most 2,048 characters.');
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim(),
        image: trimmedImage,
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save Group. Try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className='gap-3'>
      <Text className='font-semibold text-foreground'>Group name</Text>
      <Input
        accessibilityLabel='Group name'
        value={name}
        onChangeText={setName}
        maxLength={100}
        editable={!saving}
      />
      <Text className='font-semibold text-foreground'>
        Description (optional)
      </Text>
      <Input
        accessibilityLabel='Group description'
        value={description}
        onChangeText={setDescription}
        maxLength={2000}
        multiline
        className='h-24'
        editable={!saving}
      />
      <Text className='font-semibold text-foreground'>
        Image URL (optional)
      </Text>
      <Input
        accessibilityLabel='Group image URL'
        value={image}
        onChangeText={setImage}
        maxLength={2048}
        autoCapitalize='none'
        keyboardType='url'
        editable={!saving}
      />
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
      <Button
        accessibilityLabel={initial ? 'Save Group' : 'Create Group'}
        onPress={save}
        isLoading={saving}
        disabled={saving}
      >
        {initial ? 'Save Group' : 'Create Group'}
      </Button>
      {onCancel ? (
        <Button variant='ghost' onPress={onCancel} disabled={saving}>
          Cancel
        </Button>
      ) : null}
    </View>
  );
}
