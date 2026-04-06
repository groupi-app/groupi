import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const HEAD_PATH =
  'M62.4375 111.375C93.1929 111.375 118.125 86.4429 118.125 55.6875C118.125 24.9321 93.1929 0 62.4375 0C31.6821 0 6.75 24.9321 6.75 55.6875C6.75 86.4429 31.6821 111.375 62.4375 111.375Z';
const BODY_PATH =
  'M0 162.562C0 128.079 27.9542 100.125 62.4375 100.125C96.9208 100.125 124.875 128.079 124.875 162.562V225H0V162.562Z';
const ARM_PATH =
  'M183.022 42.0739C172.613 34.3539 157.916 36.5342 150.196 46.9438L107.263 104.833C121.956 114.28 131.906 129.83 134.24 147.243L187.892 74.9004C195.612 64.4908 193.432 49.7939 183.022 42.0739Z';

const VIEWBOX = '-6 -6 203 237';

interface LogoStickerProps {
  size?: number;
  color?: string;
  waving?: boolean;
}

export function LogoSticker({
  size = 120,
  color = '#8200AD',
  waving = false,
}: LogoStickerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (waving) {
      rotation.value = withRepeat(
        withTiming(-8, { duration: 400 }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
    }
  }, [waving, rotation]);

  const armStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const aspectRatio = 203 / 237;
  const width = size;
  const height = size / aspectRatio;

  return (
    <View style={{ width, height }}>
      {/* Body + head (static) */}
      <Svg width={width} height={height} viewBox={VIEWBOX} fill="none">
        <G stroke="white" strokeWidth={12} fill="none">
          <Path d={HEAD_PATH} />
          <Path d={BODY_PATH} />
        </G>
        <G fill={color}>
          <Path d={HEAD_PATH} />
          <Path d={BODY_PATH} />
        </G>
      </Svg>
      {/* Arm (animated) - outline and fill move together */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width, height },
          armStyle,
        ]}
      >
        <Svg width={width} height={height} viewBox={VIEWBOX} fill="none">
          <Path d={ARM_PATH} stroke="white" strokeWidth={12} fill="none" />
          <Path d={ARM_PATH} fill={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}
