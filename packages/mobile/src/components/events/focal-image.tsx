import { useEffect, useMemo, useState } from 'react';
import { Image, View, type LayoutChangeEvent } from 'react-native';

import { getCoverImageBounds, type FocalPoint } from '@/lib/image-focal-point';

interface FocalImageProps {
  uri: string;
  focalPoint?: FocalPoint | null;
  className?: string;
  accessibilityLabel?: string;
}

export function FocalImage({
  uri,
  focalPoint,
  className,
  accessibilityLabel,
}: FocalImageProps) {
  const [containerSize, setContainerSize] = useState({ width: 16, height: 9 });
  const [imageSize, setImageSize] = useState({ width: 16, height: 9 });

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize({ width: 16, height: 9 })
    );
  }, [uri]);

  const imageBounds = useMemo(
    () =>
      getCoverImageBounds(
        imageSize.width,
        imageSize.height,
        containerSize.width,
        containerSize.height,
        focalPoint
      ),
    [containerSize, focalPoint, imageSize]
  );

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  return (
    <View
      className={className}
      onLayout={handleLayout}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    >
      <Image
        source={{ uri }}
        accessible={false}
        style={{
          position: 'absolute',
          left: imageBounds.left,
          top: imageBounds.top,
          width: imageBounds.width,
          height: imageBounds.height,
        }}
      />
    </View>
  );
}
