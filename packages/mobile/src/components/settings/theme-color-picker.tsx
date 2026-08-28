import { useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Text } from '@/components/ui/text';
import {
  colorToHex,
  hsvToHex,
  isHexColor,
  parseColorToHsv,
  type HsvColor,
} from '@/lib/color-utils';
import { cn } from '@/lib/utils';

const swatches = [
  '#8B00B8',
  '#B23AEE',
  '#2563EB',
  '#0EA5E9',
  '#14B8A6',
  '#16A34A',
  '#84CC16',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#111827',
  '#6B7280',
  '#F3F4F6',
  '#FFFFFF',
] as const;

interface ThemeColorPickerProps {
  open: boolean;
  title: string;
  color: string;
  baseColor: string;
  hasOverride: boolean;
  onApply: (color: string) => void;
  onUseBase: () => void;
  onClose: () => void;
}

export function ThemeColorPicker({
  open,
  title,
  color,
  baseColor,
  hasOverride,
  onApply,
  onUseBase,
  onClose,
}: ThemeColorPickerProps) {
  const primaryForegroundColor = String(
    useCSSVariable('--color-primary-foreground')
  );
  const initialHsv = parseColorToHsv(color) ?? { h: 275, s: 1, v: 0.72 };
  const [hsv, setHsv] = useState<HsvColor>(initialHsv);
  const [hexInput, setHexInput] = useState(hsvToHex(initialHsv));

  const selectedColor = hsvToHex(hsv);
  const inputIsValid = isHexColor(hexInput);

  function setPickerColor(nextHsv: HsvColor) {
    setHsv(nextHsv);
    setHexInput(hsvToHex(nextHsv));
  }

  function commitHexInput() {
    const parsed = parseColorToHsv(hexInput);
    if (parsed) setPickerColor(parsed);
  }

  function apply() {
    const parsed = parseColorToHsv(hexInput);
    onApply(parsed ? hsvToHex(parsed) : selectedColor);
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
            accessibilityLabel='Cancel color selection'
            className='min-h-[44px] min-w-16 justify-center'
          >
            <Text className='text-base text-muted-foreground'>Cancel</Text>
          </Pressable>
          <Text className='max-w-52 text-center text-lg font-semibold text-foreground'>
            {title}
          </Text>
          <Pressable
            onPress={apply}
            disabled={!inputIsValid}
            accessibilityRole='button'
            accessibilityLabel='Apply selected color'
            accessibilityState={{ disabled: !inputIsValid }}
            className='min-h-[44px] min-w-16 items-end justify-center'
          >
            <Text
              className={cn(
                'text-base font-semibold text-primary',
                !inputIsValid && 'opacity-40'
              )}
            >
              Done
            </Text>
          </Pressable>
        </View>

        <View className='flex-1 gap-5 px-5 pb-8 pt-5'>
          <SaturationValuePanel hsv={hsv} onChange={setPickerColor} />
          <HueSlider hsv={hsv} onChange={setPickerColor} />

          <View>
            <Text className='mb-2 text-sm font-semibold text-foreground'>
              Quick colors
            </Text>
            <View className='flex-row flex-wrap gap-2.5'>
              {swatches.map(swatch => {
                const selected = swatch === selectedColor;
                return (
                  <Pressable
                    key={swatch}
                    onPress={() => {
                      const nextHsv = parseColorToHsv(swatch);
                      if (nextHsv) setPickerColor(nextHsv);
                    }}
                    accessibilityRole='radio'
                    accessibilityLabel={`Select ${swatch}`}
                    accessibilityState={{ checked: selected }}
                    className={cn(
                      'h-10 w-10 items-center justify-center rounded-badge border-2',
                      selected ? 'border-primary' : 'border-border'
                    )}
                    style={{ backgroundColor: swatch }}
                  >
                    {selected ? (
                      <Ionicons
                        name='checkmark'
                        size={18}
                        color={primaryForegroundColor}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className='flex-row items-end gap-3'>
            <View
              className='h-12 w-12 rounded-button border border-border'
              style={{ backgroundColor: selectedColor }}
            />
            <LabeledInput
              testID='theme-color-hex-input'
              label='HEX value'
              value={hexInput}
              onChangeText={setHexInput}
              onEndEditing={commitHexInput}
              onSubmitEditing={commitHexInput}
              maxLength={7}
              autoCapitalize='characters'
              autoCorrect={false}
              spellCheck={false}
              returnKeyType='done'
              error={inputIsValid ? undefined : 'Enter a valid HEX color.'}
              containerClassName='flex-1'
              className='font-mono'
            />
          </View>

          <View className='mt-auto'>
            <Button
              variant='outline'
              onPress={onUseBase}
              disabled={!hasOverride}
              accessibilityLabel='Use base theme color'
            >
              <View
                className='h-5 w-5 rounded-badge border border-border'
                style={{ backgroundColor: colorToHex(baseColor) ?? baseColor }}
              />
              <Text className='font-medium text-foreground'>Use Base</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SaturationValuePanel({
  hsv,
  onChange,
}: {
  hsv: HsvColor;
  onChange: (color: HsvColor) => void;
}) {
  const [size, setSize] = useState({ width: 320, height: 220 });
  const selectedColor = hsvToHex(hsv);
  const fullHueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  function updateFromTouch(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    onChange({
      h: hsv.h,
      s: Math.min(1, Math.max(0, locationX / size.width)),
      v: Math.min(1, Math.max(0, 1 - locationY / size.height)),
    });
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const delta = event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
    onChange({ ...hsv, v: Math.min(1, Math.max(0, hsv.v + delta)) });
  }

  return (
    <View
      testID='theme-color-saturation-panel'
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={updateFromTouch}
      onResponderMove={updateFromTouch}
      onResponderTerminationRequest={() => false}
      accessibilityRole='adjustable'
      accessibilityLabel='Color saturation and brightness'
      accessibilityHint='Drag to choose saturation and brightness.'
      accessibilityValue={{ text: selectedColor }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase brightness' },
        { name: 'decrement', label: 'Decrease brightness' },
      ]}
      onAccessibilityAction={handleAccessibilityAction}
      className='w-full overflow-hidden rounded-card border border-border'
      style={{ height: 220 }}
    >
      <Svg width='100%' height='100%' pointerEvents='none'>
        <Defs>
          <LinearGradient
            id='saturation-white'
            x1='0%'
            y1='0%'
            x2='100%'
            y2='0%'
          >
            <Stop offset='0' stopColor='#FFFFFF' stopOpacity='1' />
            <Stop offset='1' stopColor='#FFFFFF' stopOpacity='0' />
          </LinearGradient>
          <LinearGradient id='value-black' x1='0%' y1='0%' x2='0%' y2='100%'>
            <Stop offset='0' stopColor='#000000' stopOpacity='0' />
            <Stop offset='1' stopColor='#000000' stopOpacity='1' />
          </LinearGradient>
        </Defs>
        <Rect width='100%' height='100%' fill={fullHueColor} />
        <Rect width='100%' height='100%' fill='url(#saturation-white)' />
        <Rect width='100%' height='100%' fill='url(#value-black)' />
        <Circle
          cx={12 + hsv.s * (size.width - 24)}
          cy={12 + (1 - hsv.v) * (size.height - 24)}
          r='12'
          fill={selectedColor}
          stroke='#FFFFFF'
          strokeWidth='3'
        />
      </Svg>
    </View>
  );
}

function HueSlider({
  hsv,
  onChange,
}: {
  hsv: HsvColor;
  onChange: (color: HsvColor) => void;
}) {
  const [width, setWidth] = useState(320);

  function updateFromTouch(event: GestureResponderEvent) {
    const hue = Math.min(
      360,
      Math.max(0, (event.nativeEvent.locationX / width) * 360)
    );
    onChange({ ...hsv, h: hue });
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const delta = event.nativeEvent.actionName === 'increment' ? 10 : -10;
    onChange({ ...hsv, h: (hsv.h + delta + 360) % 360 });
  }

  return (
    <View>
      <Text className='mb-2 text-sm font-semibold text-foreground'>Hue</Text>
      <View
        testID='theme-color-hue-slider'
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={updateFromTouch}
        onResponderMove={updateFromTouch}
        onResponderTerminationRequest={() => false}
        accessibilityRole='adjustable'
        accessibilityLabel='Color hue'
        accessibilityHint='Drag to choose a hue.'
        accessibilityValue={{ min: 0, max: 360, now: Math.round(hsv.h) }}
        accessibilityActions={[
          { name: 'increment', label: 'Increase hue' },
          { name: 'decrement', label: 'Decrease hue' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        className='h-11 w-full overflow-hidden rounded-button border border-border'
      >
        <Svg width='100%' height='100%' pointerEvents='none'>
          <Defs>
            <LinearGradient id='hue-spectrum' x1='0%' y1='0%' x2='100%' y2='0%'>
              <Stop offset='0' stopColor='#FF0000' />
              <Stop offset='0.167' stopColor='#FFFF00' />
              <Stop offset='0.333' stopColor='#00FF00' />
              <Stop offset='0.5' stopColor='#00FFFF' />
              <Stop offset='0.667' stopColor='#0000FF' />
              <Stop offset='0.833' stopColor='#FF00FF' />
              <Stop offset='1' stopColor='#FF0000' />
            </LinearGradient>
          </Defs>
          <Rect width='100%' height='100%' fill='url(#hue-spectrum)' />
          <Circle
            cx={9 + (hsv.h / 360) * (width - 18)}
            cy='22'
            r='9'
            fill={hsvToHex({ h: hsv.h, s: 1, v: 1 })}
            stroke='#FFFFFF'
            strokeWidth='3'
          />
        </Svg>
      </View>
    </View>
  );
}
