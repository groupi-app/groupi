import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  focalPointFromTouch,
  getContainedImageBounds,
  normalizeFocalPoint,
  type FocalPoint,
} from '@/lib/image-focal-point';
import { FocalImage } from './focal-image';

interface ImageFocalPointPickerProps {
  imageUri: string;
  focalPoint?: FocalPoint | null;
  open: boolean;
  onSave: (focalPoint: FocalPoint) => void;
  onClose: () => void;
}

export function ImageFocalPointPicker({
  imageUri,
  focalPoint,
  open,
  onSave,
  onClose,
}: ImageFocalPointPickerProps) {
  const [draft, setDraft] = useState(() => normalizeFocalPoint(focalPoint));
  const [containerSize, setContainerSize] = useState({
    width: 320,
    height: 320,
  });
  const [imageSize, setImageSize] = useState({ width: 16, height: 9 });
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');

  useEffect(() => {
    if (!open) return;

    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize({ width: 16, height: 9 })
    );
  }, [imageUri, open]);

  const imageBounds = useMemo(
    () =>
      getContainedImageBounds(
        imageSize.width,
        imageSize.height,
        containerSize.width,
        containerSize.height
      ),
    [containerSize, imageSize]
  );

  function updateFromTouch(event: GestureResponderEvent) {
    setDraft(
      focalPointFromTouch(
        event.nativeEvent.locationX,
        event.nativeEvent.locationY,
        imageBounds
      )
    );
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  return (
    <Modal
      visible={open}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View className='flex-1 bg-background'>
        <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
          <Pressable
            onPress={onClose}
            accessibilityRole='button'
            accessibilityLabel='Cancel image position changes'
            className='min-h-[44px] min-w-16 justify-center'
          >
            <Text className='text-base text-muted-foreground'>Cancel</Text>
          </Pressable>
          <Text className='text-center text-lg font-semibold text-foreground'>
            Adjust Position
          </Text>
          <Pressable
            onPress={() => onSave(draft)}
            accessibilityRole='button'
            accessibilityLabel='Save image position'
            className='min-h-[44px] min-w-16 items-end justify-center'
          >
            <Text className='text-base font-semibold text-primary'>Done</Text>
          </Pressable>
        </View>

        <View className='flex-1 gap-5 px-5 pb-8 pt-5'>
          <Text className='text-sm text-muted-foreground'>
            Tap or drag to keep the most important part of the image visible
            when the cover is cropped.
          </Text>

          <View
            onLayout={handleLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={updateFromTouch}
            onResponderMove={updateFromTouch}
            onResponderTerminationRequest={() => false}
            accessibilityRole='adjustable'
            accessibilityLabel='Cover image focal point'
            accessibilityHint='Tap or drag over the image to choose its focal point.'
            className='relative h-80 w-full overflow-hidden rounded-card border border-border bg-muted'
          >
            <Image
              source={{ uri: imageUri }}
              resizeMode='contain'
              accessible={false}
              style={{
                position: 'absolute',
                left: imageBounds.left,
                top: imageBounds.top,
                width: imageBounds.width,
                height: imageBounds.height,
              }}
            />
            <View
              pointerEvents='none'
              className='absolute h-12 w-12 items-center justify-center rounded-badge border-[3px] border-white bg-black/20 shadow-overlay'
              style={{
                left: imageBounds.left + imageBounds.width * draft.x - 24,
                top: imageBounds.top + imageBounds.height * draft.y - 24,
              }}
            >
              <View
                className='h-4 w-4 rounded-badge border-2 border-white'
                style={{ backgroundColor: primaryColor }}
              />
            </View>
          </View>

          <View className='gap-2'>
            <Text className='text-sm font-semibold text-foreground'>
              Cropped preview
            </Text>
            <View className='aspect-[21/9] overflow-hidden rounded-card border border-border'>
              <FocalImage
                uri={imageUri}
                focalPoint={draft}
                className='h-full w-full'
              />
            </View>
          </View>

          <Button
            variant='outline'
            onPress={() => setDraft({ x: 0.5, y: 0.5 })}
            className='mt-auto'
          >
            <Ionicons name='locate-outline' size={18} color={primaryColor} />
            <Text className='font-medium text-foreground'>Reset to Center</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
