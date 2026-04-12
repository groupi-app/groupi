import {
  useCallback,
  useRef,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { View, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { Text } from './text';
import { Separator } from './separator';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActionMenuOption {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuState {
  title?: string;
  message?: string;
  options: ActionMenuOption[];
}

interface ActionMenuContextValue {
  showActionMenu: (opts: ActionMenuState) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

export function useActionMenu() {
  const ctx = useContext(ActionMenuContext);
  if (!ctx) {
    throw new Error('useActionMenu must be used within ActionMenuProvider');
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ActionMenuProvider({ children }: { children: ReactNode }) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [state, setState] = useState<ActionMenuState>({ options: [] });

  const bgColor = (useCSSVariable('--color-card') as string) ?? '#ffffff';
  const borderColor = (useCSSVariable('--color-border') as string) ?? '#e5e7eb';

  const showActionMenu = useCallback((opts: ActionMenuState) => {
    setState(opts);
    bottomSheetRef.current?.present();
  }, []);

  const handleSelect = useCallback((option: ActionMenuOption) => {
    bottomSheetRef.current?.dismiss();
    // Delay the action slightly so the sheet closes smoothly
    setTimeout(() => option.onPress(), 150);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <ActionMenuContext.Provider value={{ showActionMenu }}>
      {children}
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: bgColor }}
        handleIndicatorStyle={{ backgroundColor: borderColor }}
      >
        <BottomSheetView style={{ paddingBottom: 34 }}>
          {/* Title & message */}
          {state.title || state.message ? (
            <View className='px-5 pb-3 pt-1'>
              {state.title ? (
                <Text className='text-center text-base font-semibold'>
                  {state.title}
                </Text>
              ) : null}
              {state.message ? (
                <Text className='mt-1 text-center text-sm text-muted-foreground'>
                  {state.message}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Separator />

          {/* Options */}
          {state.options.map((option, index) => (
            <View key={`${option.label}-${index}`}>
              <Pressable
                onPress={() => handleSelect(option)}
                className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
              >
                {option.icon ? (
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={option.destructive ? '#ef4444' : '#6b7280'}
                  />
                ) : null}
                <Text
                  className={`flex-1 text-base ${
                    option.destructive
                      ? 'font-medium text-destructive'
                      : 'text-foreground'
                  }`}
                >
                  {option.label}
                </Text>
                {option.destructive ? null : (
                  <Ionicons name='chevron-forward' size={18} color='#9ca3af' />
                )}
              </Pressable>
              {index < state.options.length - 1 ? <Separator /> : null}
            </View>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    </ActionMenuContext.Provider>
  );
}
