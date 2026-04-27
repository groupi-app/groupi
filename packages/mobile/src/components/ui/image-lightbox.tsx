import {
  Modal,
  View,
  Image,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export function ImageLightbox({ uri, visible, onClose }: ImageLightboxProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(0.5, Math.min(e.scale, 4));
    })
    .onEnd(() => {
      scale.value = withTiming(1);
    });

  const pan = Gesture.Pan()
    .onUpdate(e => {
      translateY.value = e.translationY;
      // Fade background as user drags down
      opacity.value = Math.max(0, 1 - Math.abs(e.translationY) / 300);
    })
    .onEnd(e => {
      if (Math.abs(e.translationY) > 120) {
        // Dismiss
        opacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(
          e.translationY > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
          { duration: 200 },
          () => {
            runOnJS(onClose)();
          }
        );
      } else {
        // Snap back
        translateY.value = withTiming(0);
        opacity.value = withTiming(1);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(scale.value > 1 ? 1 : 2);
    });

  const composed = Gesture.Simultaneous(
    pinch,
    Gesture.Exclusive(doubleTap, pan)
  );

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${opacity.value * 0.95})`,
  }));

  function handleClose() {
    scale.value = 1;
    translateY.value = 0;
    opacity.value = 1;
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle='light-content' />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, backdropStyle]}>
          {/* Close button */}
          <View className='absolute right-4 top-14 z-tooltip'>
            <Pressable
              onPress={handleClose}
              className='h-10 w-10 items-center justify-center rounded-full bg-white/20'
            >
              <Ionicons name='close' size={24} color='#ffffff' />
            </Pressable>
          </View>

          {/* Image */}
          <GestureDetector gesture={composed}>
            <Animated.View
              style={[
                {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                imageStyle,
              ]}
            >
              <Image
                source={{ uri }}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT * 0.7,
                }}
                resizeMode='contain'
              />
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
