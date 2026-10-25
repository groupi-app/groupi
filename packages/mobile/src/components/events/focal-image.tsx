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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (width, height) => {
        if (active) setImageSize({ uri, width, height });
      },
      () => {
        if (active) setImageSize({ uri, width: 16, height: 9 });
      }
    );
    return () => {
      active = false;
    };
  }, [uri]);

  const imageBounds = useMemo(
    () =>
      getCoverImageBounds(
        imageSize?.width ?? 0,
        imageSize?.height ?? 0,
        containerSize.width,
        containerSize.height,
        focalPoint
      ),
    [containerSize, focalPoint, imageSize]
  );
  const ready =
    containerSize.width > 0 &&
    containerSize.height > 0 &&
    imageSize?.uri === uri;

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  return (
    <View
      className={className}
      style={{ overflow: 'hidden' }}
      onLayout={handleLayout}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    >
      {ready ? (
        <Image
          // Decode only at the measured cover size. The native image request
          // can be reused for the same URI when its layout grows in place.
          key={`${uri}:${imageBounds.width}:${imageBounds.height}`}
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
      ) : null}
    </View>
  );
}
