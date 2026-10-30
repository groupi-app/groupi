import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupDiscordHooks } from '@groupi/shared/hooks';
export const {
  useGroupDiscordEnrollment,
  useGroupDiscordConnection,
  useConfigureGroupDiscord,
  useGroupDiscordSettings,
} = createGroupDiscordHooks(api, { useQuery, useAction, useMutation });
