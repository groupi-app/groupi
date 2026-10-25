import {
  Modal,
  View,
  Image,
  Pressable,
  StatusBar,
  useWindowDimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export function ImageLightbox({ uri, visible, onClose }: ImageLightboxProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
          e.translationY > 0 ? screenHeight : -screenHeight,
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
                  width: screenWidth,
                  height: screenHeight * 0.7,
                }}
                resizeMode='contain'
              />
            </Animated.View>
          </GestureDetector>

          {/* Keep controls above the full-screen gesture surface. */}
          <View pointerEvents='box-none' className='absolute inset-0 z-tooltip'>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              className='absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-white/20 active:bg-white/30'
              style={{ top: insets.top + 8 }}
              accessibilityRole='button'
              accessibilityLabel='Close image viewer'
              accessibilityHint='Returns to the event'
            >
              <Ionicons name='close' size={24} color='#ffffff' />
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
