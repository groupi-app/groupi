import { useEffect, useRef, useState } from 'react';
import type { useQuery, useAction, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
interface GroupDiscordApi {
  discord: { actions: { getAvailableGuilds: FunctionReference<'action'> } };
  groupDiscord: {
    queries: { getConnection: FunctionReference<'query'> };
    mutations: { disable: FunctionReference<'mutation'> };
    actions: {
      configure: FunctionReference<'action'>;
      refreshMetadata: FunctionReference<'action'>;
    };
    enrollment: { getStatus: FunctionReference<'query'> };
    connect: { connect: FunctionReference<'action'> };
  };
}
export function createGroupDiscordHooks<Api extends GroupDiscordApi>(
  api: Api,
  hooks: {
    useQuery: typeof useQuery;
    useAction: typeof useAction;
    useMutation: typeof useMutation;
  }
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
    args: FunctionArgs<Api['groupDiscord']['queries']['getConnection']>,
    options: { refreshMetadataOnMount?: boolean } = {}
  ) {
    const connection = useGroupDiscordConnection(args);
    const configure = useConfigureGroupDiscord();
    const refreshMetadata = hooks.useAction<
      Api['groupDiscord']['actions']['refreshMetadata']
    >(api.groupDiscord.actions.refreshMetadata);
    const disableMutation = hooks.useMutation<
      Api['groupDiscord']['mutations']['disable']
    >(api.groupDiscord.mutations.disable);
    const [handbackConfirmed, setHandbackConfirmed] = useState(false);
    async function disable() {
      setBusy(true);
      setError('');
      try {
        await disableMutation({
          ...args,
          acknowledgeHandback: handbackConfirmed,
        });
        setHandbackConfirmed(false);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to disable Discord.'
        );
      } finally {
        setBusy(false);
      }
    }
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
    const refreshed = useRef(new Set<string>());
    const groupId = args.groupId;
    const generation = connection?.generation;
    const active = connection?.status === 'active';
    useEffect(() => {
      if (
        !options.refreshMetadataOnMount ||
        !active ||
        generation === undefined
      )
        return;
      const key = `${groupId}:${generation}`;
      if (refreshed.current.has(key)) return;
      refreshed.current.add(key);
      // Metadata-only action rechecks Group and Discord authority. One attempt per
      // generation; subscription updates and failures must not cause retry loops.
      void refreshMetadata(args).catch(cause => {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to update Discord server details.'
        );
      });
    }, [
      options.refreshMetadataOnMount,
      active,
      generation,
      groupId,
      refreshMetadata,
      args,
    ]);
    const guildId = guildDraft ?? connection?.guildId ?? '';
    const mode = modeDraft ?? connection?.mode ?? 'role';
    const roleId =
      roleDraft ??
      (connection?.status === 'disabled' ? '' : (connection?.roleId ?? ''));
    const landingChannelId = channelDraft ?? connection?.landingChannelId ?? '';
    async function save() {
      setError('');
      setMessage('');
      if (connection && connection.status !== 'disabled') {
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
    async function refreshServerDetails() {
      setBusy(true);
      setError('');
      setMessage('');
      try {
        await refreshMetadata(args);
        setMessage('Discord server details refreshed.');
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to refresh Discord server details.'
        );
      } finally {
        setBusy(false);
      }
    }
    return {
      connection,
      refreshServerDetails,
      disable,
      handbackConfirmed,
      setHandbackConfirmed,
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
  function useGroupDiscordEnrollment(
    args: FunctionArgs<Api['groupDiscord']['enrollment']['getStatus']>,
    requestConsent: () => Promise<void>
  ) {
    const enrollment = hooks.useQuery<
      Api['groupDiscord']['enrollment']['getStatus']
    >(api.groupDiscord.enrollment.getStatus, args);
    const enroll = hooks.useAction<Api['groupDiscord']['connect']['connect']>(
      api.groupDiscord.connect.connect
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    async function connect() {
      setBusy(true);
      setError('');
      setMessage('');
      try {
        const result = await enroll({ ...args, consent: true });
        if (result.requiresConsent) {
          await requestConsent();
          setMessage(
            'After authorizing Discord, return here and select Connect Discord to enroll.'
          );
        } else {
          setMessage(
            'Discord connection requested. Your access status will update here.'
          );
        }
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to connect Discord.'
        );
      } finally {
        setBusy(false);
      }
    }
    return { enrollment, busy, error, message, connect };
  }
  return {
    useGroupDiscordEnrollment,
    useGroupDiscordConnection,
    useConfigureGroupDiscord,
    useGroupDiscordSettings,
  };
}
