'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createEventSettingsHooks } from '@groupi/shared/hooks';
export const {
  useEventSettings,
  useSaveEventSettings,
  useEventSettingsAudienceOptions,
} = createEventSettingsHooks(api, { useQuery, useMutation });
