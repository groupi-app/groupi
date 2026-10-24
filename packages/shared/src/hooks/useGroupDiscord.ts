import { useState } from 'react';
import type { useQuery, useAction } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
interface GroupDiscordApi {
  discord: { actions: { getAvailableGuilds: FunctionReference<'action'> } };
  groupDiscord: {
    queries: { getConnection: FunctionReference<'query'> };
    actions: { configure: FunctionReference<'action'> };
  };
}
export function createGroupDiscordHooks<Api extends GroupDiscordApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useAction: typeof useAction }
) {
  function useGroupDiscordConnection(
    args: FunctionArgs<Api['groupDiscord']['queries']['getConnection']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupDiscord']['queries']['getConnection']>(
      api.groupDiscord.queries.getConnection,
      args
    );
  }
  function useConfigureGroupDiscord() {
    return hooks.useAction<Api['groupDiscord']['actions']['configure']>(
      api.groupDiscord.actions.configure
    );
  }
  function useGroupDiscordSettings(
    args: FunctionArgs<Api['groupDiscord']['queries']['getConnection']>
  ) {
    const connection = useGroupDiscordConnection(args);
    const configure = useConfigureGroupDiscord();
    const discover = hooks.useAction<
      Api['discord']['actions']['getAvailableGuilds']
    >(api.discord.actions.getAvailableGuilds);
    const [guilds, setGuilds] = useState<Awaited<
      ReturnType<typeof discover>
    > | null>(null);
    const [loadingGuilds, setLoadingGuilds] = useState(false);
    async function loadGuilds() {
      setLoadingGuilds(true);
      setError('');
      try {
        setGuilds(await discover({}));
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load Discord servers.'
        );
      } finally {
        setLoadingGuilds(false);
      }
    }
    const [guildDraft, setGuildId] = useState<string | null>(null);
    const [modeDraft, setMode] = useState<'role' | 'membership' | null>(null);
    const [roleDraft, setRoleId] = useState<string | null>(null);
    const [channelDraft, setLandingChannelId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const guildId = guildDraft ?? connection?.guildId ?? '';
    const mode = modeDraft ?? connection?.mode ?? 'role';
    const roleId = roleDraft ?? connection?.roleId ?? '';
    const landingChannelId = channelDraft ?? connection?.landingChannelId ?? '';
    async function save() {
      setError('');
      setMessage('');
      if (connection) {
        setError(
          'This Group already has a Discord connection. Contact a Group owner to resolve setup issues.'
        );
        return;
      }
      if (!guildId.trim()) {
        setError('Enter a Discord server ID.');
        return;
      }
      setBusy(true);
      try {
        await configure({
          ...args,
          guildId: guildId.trim(),
          mode,
          ...(mode === 'role' && roleId.trim()
            ? { roleId: roleId.trim() }
            : {}),
          ...(landingChannelId.trim()
            ? { landingChannelId: landingChannelId.trim() }
            : {}),
        });
        setMessage('Discord connection saved.');
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to save Discord connection.'
        );
      } finally {
        setBusy(false);
      }
    }
    return {
      connection,
      guilds,
      loadingGuilds,
      loadGuilds,
      guildId,
      setGuildId,
      mode,
      setMode,
      roleId,
      setRoleId,
      landingChannelId,
      setLandingChannelId,
      busy,
      error,
      message,
      save,
    };
  }
  return {
    useGroupDiscordConnection,
    useConfigureGroupDiscord,
    useGroupDiscordSettings,
  };
}
