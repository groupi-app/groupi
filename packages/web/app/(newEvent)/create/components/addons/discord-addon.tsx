'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAction, useQuery } from 'convex/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  type AddonConfigProps,
  type EventCardProps,
  type ManageConfigProps,
  registerAddon,
} from '../addon-registry';
import { useHasLinkedProviders } from '@/hooks/convex/use-accounts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let discordQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let discordActions: any;

function initApi() {
  if (!discordQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    discordQueries = api.discord?.queries ?? {};
    discordActions = api.discord?.actions ?? {};
  }
}
initApi();

// ===== Types =====

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

// ===== Server Picker (shared between create + manage) =====

function GuildIcon({ guild }: { guild: DiscordGuild }) {
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=32`
    : null;

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconUrl} alt='' className='size-8 rounded-full shrink-0' />
    );
  }

  return (
    <div className='size-8 rounded-full bg-bg-interactive flex items-center justify-center shrink-0'>
      <Icons.discord className='size-4 text-muted-foreground' />
    </div>
  );
}

function DiscordServerPicker({
  selectedGuildId,
  onSelect,
}: {
  selectedGuildId: string | null;
  onSelect: (guild: DiscordGuild) => void;
}) {
  const providers = useHasLinkedProviders();
  const fetchGuilds = useAction(discordActions.getAvailableGuilds);
  const [available, setAvailable] = useState<DiscordGuild[] | null>(null);
  const [invitable, setInvitable] = useState<DiscordGuild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGuilds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchGuilds({});
      setAvailable(result.available);
      setInvitable(result.invitable);
    } catch {
      setError('Failed to load Discord servers');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGuilds]);

  useEffect(() => {
    if (providers?.discord) {
      loadGuilds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers?.discord]);

  if (!providers) {
    return (
      <p className='text-sm text-muted-foreground'>Loading account info...</p>
    );
  }

  if (!providers.discord) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          Link your Discord account to select a server.
        </p>
        <Button variant='outline' size='sm' asChild>
          <a href='/settings/account'>
            <Icons.discord className='size-4 mr-1.5' />
            Link Discord
          </a>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Icons.spinner className='size-4 animate-spin' />
        Loading servers...
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-error'>{error}</p>
        <Button variant='outline' size='sm' onClick={loadGuilds}>
          Retry
        </Button>
      </div>
    );
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

  if (!available || (available.length === 0 && invitable.length === 0)) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          No servers found. You need Manage Server permissions in a Discord
          server to add the bot.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {available.length > 0 && (
        <div className='space-y-2'>
          <label className='text-sm font-medium leading-none'>
            Select a Discord server
          </label>
          <div className='flex flex-col gap-1.5 max-h-60 overflow-y-auto'>
            {available.map(guild => {
              const isSelected = guild.id === selectedGuildId;

              return (
                <button
                  key={guild.id}
                  type='button'
                  onClick={() => onSelect(guild)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-card text-left transition-colors duration-fast',
                    isSelected
                      ? 'bg-primary/10 ring-2 ring-primary/30'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <GuildIcon guild={guild} />
                  <span className='text-sm font-medium truncate'>
                    {guild.name}
                  </span>
                  {isSelected && (
                    <Icons.check className='size-4 text-primary ml-auto shrink-0' />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {invitable.length > 0 && (
        <div className='space-y-2'>
          <label className='text-sm font-medium leading-none text-muted-foreground'>
            {available.length > 0
              ? 'Add bot to more servers'
              : 'Add bot to a server'}
          </label>
          <div className='flex flex-col gap-1.5 max-h-60 overflow-y-auto'>
            {invitable.map(guild => {
              const inviteUrl = clientId
                ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=17600775979008&scope=bot&guild_id=${guild.id}&disable_guild_select=true`
                : null;

              return (
                <a
                  key={guild.id}
                  href={inviteUrl ?? '#'}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={inviteUrl ? undefined : e => e.preventDefault()}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-card text-left transition-colors duration-fast',
                    inviteUrl
                      ? 'bg-muted/50 hover:bg-muted'
                      : 'bg-muted/30 opacity-60 cursor-not-allowed'
                  )}
                >
                  <GuildIcon guild={guild} />
                  <span className='text-sm font-medium truncate flex-1'>
                    {guild.name}
                  </span>
                  <span className='text-xs text-muted-foreground shrink-0'>
                    Add bot
                  </span>
                  <Icons.link className='size-3.5 text-muted-foreground shrink-0' />
                </a>
              );
            })}
          </div>
          {!clientId && (
            <p className='text-xs text-warning'>
              NEXT_PUBLIC_DISCORD_CLIENT_ID is not set. Restart your dev server
              after adding it to .env.local.
            </p>
          )}
          {clientId && (
            <p className='text-xs text-muted-foreground'>
              After adding the bot, click{' '}
              <button
                type='button'
                onClick={loadGuilds}
                className='underline hover:text-foreground'
              >
                refresh
              </button>{' '}
              to update the list.
            </p>
          )}
        </div>
      )}

      {available.length === 0 && invitable.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No servers found. You need Manage Server permissions in a Discord
          server to add the bot.
        </p>
      )}
    </div>
  );
}

// ===== Create Wizard Config =====

function DiscordCreateConfig({ formState, setFormState }: AddonConfigProps) {
  const config = formState.addonConfigs?.['discord'] as
    | { guildId: string; guildName: string }
    | undefined;

  const handleSelect = (guild: DiscordGuild) => {
    setFormState({
      ...formState,
      addonConfigs: {
        ...formState.addonConfigs,
        discord: { guildId: guild.id, guildName: guild.name },
      },
    });
  };

  return (
    <DiscordServerPicker
      selectedGuildId={config?.guildId ?? null}
      onSelect={handleSelect}
    />
  );
}

// ===== Event Page Card =====

function DiscordEventCard({ eventId, chosenDateTime }: EventCardProps) {
  const discordInfo = useQuery(discordQueries.getDiscordEventInfo, {
    eventId,
  });

  if (discordInfo === undefined) {
    return (
      <Card className='rounded-card shadow-raised p-4 w-fit'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center size-9 rounded-card bg-[#5865F2]/10 shrink-0'>
            <Icons.discord className='size-5 text-[#5865F2]' />
          </div>
          <div>
            <p className='font-medium'>Discord Event</p>
            <p className='text-sm text-muted-foreground'>Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  const hasDiscordEvent =
    discordInfo !== null && discordInfo.discordEventId !== null;
  const hasError = discordInfo !== null && discordInfo.error !== null;
  const discordEventUrl = hasDiscordEvent
    ? `https://discord.com/events/${discordInfo.guildId}/${discordInfo.discordEventId}`
    : null;

  return (
    <Card className='rounded-card shadow-raised p-4 w-fit'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center justify-center size-9 rounded-card bg-[#5865F2]/10 shrink-0'>
          <Icons.discord className='size-5 text-[#5865F2]' />
        </div>
        <div>
          <p className='font-medium'>Discord Event</p>
          {hasDiscordEvent ? (
            <p className='text-sm text-muted-foreground'>
              {discordInfo.guildName ?? 'Discord server'}
            </p>
          ) : hasError ? (
            <p className='text-sm text-error'>Failed: {discordInfo.error}</p>
          ) : !chosenDateTime ? (
            <p className='text-sm text-muted-foreground'>
              Pending — set a date to create Discord event
            </p>
          ) : (
            <p className='text-sm text-muted-foreground'>Syncing...</p>
          )}
        </div>
        {discordEventUrl && (
          <Button variant='outline' size='sm' asChild className='shrink-0'>
            <a href={discordEventUrl} target='_blank' rel='noopener noreferrer'>
              Open in Discord
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

// ===== Manage Page Config =====

function DiscordManageConfig({
  config,
  onSave,
  onDisable,
  isSaving,
}: ManageConfigProps) {
  const currentGuildId = (config?.guildId as string) ?? null;
  const currentGuildName = (config?.guildName as string) ?? '';
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(
    currentGuildId
  );
  const [selectedGuildName, setSelectedGuildName] = useState(currentGuildName);
  const enabled = config !== null;
  const [pendingEnable, setPendingEnable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isOn = enabled || pendingEnable;

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setExpanded(false);
      setPendingEnable(false);
      await onDisable();
    } else if (selectedGuildId && selectedGuildName) {
      await onSave({ guildId: selectedGuildId, guildName: selectedGuildName });
      setExpanded(true);
    } else {
      setPendingEnable(true);
      setExpanded(true);
    }
  };

  const handleSelect = (guild: DiscordGuild) => {
    setSelectedGuildId(guild.id);
    setSelectedGuildName(guild.name);
  };

  const handleSave = async () => {
    if (!selectedGuildId || !selectedGuildName) return;
    await onSave({ guildId: selectedGuildId, guildName: selectedGuildName });
    setPendingEnable(false);
  };

  const hasChanges =
    selectedGuildId !== currentGuildId ||
    selectedGuildName !== currentGuildName;

  return (
    <Card
      className={cn(
        'transition-all duration-normal',
        isOn && 'ring-2 ring-primary/30'
      )}
    >
      <div className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-muted'>
          <Icons.discord className='size-5 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium leading-none'>Discord Event</p>
          <p className='text-sm text-muted-foreground mt-1'>
            Create a synced event in your Discord server
          </p>
        </div>
        {isOn && (
          <button
            type='button'
            onClick={() => setExpanded(prev => !prev)}
            className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors duration-fast'
            aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
          >
            <Icons.down
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-normal',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        <Switch
          checked={isOn}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          data-test='addon-toggle-discord'
        />
      </div>
      <Collapsible open={isOn && expanded}>
        <CollapsibleContent>
          <div className='px-4 pb-4 pt-0 space-y-3'>
            <DiscordServerPicker
              selectedGuildId={selectedGuildId}
              onSelect={handleSelect}
            />
            {hasChanges && selectedGuildId && currentGuildId && (
              <>
                <p className='text-sm text-warning'>
                  Changing servers will delete the existing Discord event and
                  create a new one.
                </p>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </>
            )}
            {(hasChanges || pendingEnable) &&
              selectedGuildId &&
              !currentGuildId && (
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ===== Registration =====

registerAddon({
  id: 'discord',
  name: 'Discord Event',
  description: 'Create a synced event in your Discord server',
  iconName: 'discord',
  author: { name: 'Groupi' },

  // Create wizard
  CreateConfigComponent: DiscordCreateConfig,
  isEnabled: formState => formState.addonConfigs?.['discord'] !== undefined,
  onEnable: formState => ({
    addonConfigs: {
      ...formState.addonConfigs,
      discord: { guildId: '', guildName: '' },
    },
  }),
  onDisable: formState => {
    const { discord: _, ...rest } = formState.addonConfigs ?? {};
    return { addonConfigs: rest };
  },
  getConfigFromFormState: formState => {
    const config = formState.addonConfigs?.['discord'];
    if (!config) return null;
    const guildId = config.guildId as string | undefined;
    if (!guildId) return null;
    return config;
  },

  // Event page
  EventCardComponent: DiscordEventCard,

  // Manage page
  ManageConfigComponent: DiscordManageConfig,

  // No dedicated page needed — the event card has the link
  supportsOptOut: false,
  requiresCompletion: false,
});
