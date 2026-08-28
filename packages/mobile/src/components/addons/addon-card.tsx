import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getCustomAddonSummary } from '@/lib/addon-contracts';

const ADDON_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  reminders: 'alarm-outline',
  questionnaire: 'help-circle-outline',
  'bring-list': 'list-outline',
  discord: 'logo-discord',
};

interface AddonCardProps {
  addonType: string;
  config: Record<string, unknown>;
  onPress?: () => void;
  completed?: boolean;
  className?: string;
}

function getAddonName(type: string, config: Record<string, unknown>): string {
  const names: Record<string, string> = {
    reminders: 'Reminders',
    questionnaire: 'Questionnaire',
    'bring-list': 'Bring List',
    discord: 'Discord',
  };
  // Handle custom addons
  if (type.startsWith('custom:')) {
    return getCustomAddonSummary(config)?.name ?? 'Custom Add-on';
  }
  return names[type] ?? type;
}

export function AddonCard({
  addonType,
  config,
  onPress,
  completed,
  className,
}: AddonCardProps) {
  const icon = ADDON_ICONS[addonType] ?? 'extension-puzzle-outline';
  const name = getAddonName(addonType, config);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}${completed === undefined ? '' : completed ? ', completed' : ', required'}`}
      accessibilityHint={onPress ? 'Opens add-on' : undefined}
      accessibilityState={{ disabled: !onPress }}
    >
      <Card className={cn('flex-row items-center gap-3', className)}>
        {/* Sticker journal aesthetic — icon container with white border */}
        <View className='h-10 w-10 items-center justify-center rounded-card border-2 border-white bg-primary shadow-raised'>
          <Ionicons name={icon} size={20} color='#ffffff' />
        </View>
        <View className='flex-1'>
          <Text className='text-base font-medium text-foreground'>{name}</Text>
          <AddonSubtitle addonType={addonType} config={config} />
        </View>
        {completed !== undefined ? (
          <View
            className={cn(
              'rounded-badge border-2 border-white px-2 py-0.5 shadow-raised',
              completed ? 'bg-success' : 'bg-muted'
            )}
          >
            <Text
              className={cn(
                'text-xs font-semibold',
                completed ? 'text-white' : 'text-muted-foreground'
              )}
            >
              {completed ? 'Done' : 'Required'}
            </Text>
          </View>
        ) : null}
        {onPress ? (
          <Ionicons name='chevron-forward' size={16} color='#9ca3af' />
        ) : null}
      </Card>
    </Pressable>
  );
}

function AddonSubtitle({
  addonType,
  config,
}: {
  addonType: string;
  config: Record<string, unknown>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = config as any;

  if (addonType === 'reminders') {
    return (
      <Text className='text-sm text-muted-foreground'>
        Event reminder configured
      </Text>
    );
  }

  if (addonType === 'questionnaire') {
    const questionCount = cfg?.questions?.length ?? 0;
    return (
      <Text className='text-sm text-muted-foreground'>
        {questionCount} {questionCount === 1 ? 'question' : 'questions'}
      </Text>
    );
  }

  if (addonType === 'bring-list') {
    const itemCount = cfg?.items?.length ?? 0;
    return (
      <Text className='text-sm text-muted-foreground'>
        {itemCount} {itemCount === 1 ? 'item' : 'items'} to bring
      </Text>
    );
  }

  if (addonType.startsWith('custom:')) {
    return (
      <Text className='text-sm text-muted-foreground' numberOfLines={1}>
        {getCustomAddonSummary(config)?.description ?? 'Custom event tool'}
      </Text>
    );
  }

  if (addonType === 'discord') {
    return (
      <Text className='text-sm text-muted-foreground'>
        {typeof cfg?.guildName === 'string'
          ? cfg.guildName
          : 'Discord event sync'}
      </Text>
    );
  }

  return <Text className='text-sm text-muted-foreground'>Add-on enabled</Text>;
}
