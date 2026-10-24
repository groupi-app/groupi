import { useQuery, useAction } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupDiscordHooks } from '@groupi/shared/hooks';
export const {
  useGroupDiscordConnection,
  useConfigureGroupDiscord,
  useGroupDiscordSettings,
} = createGroupDiscordHooks(api, { useQuery, useAction });
