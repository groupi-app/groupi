'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createEventLifecycleHooks } from '@groupi/shared/hooks';
export const { useEventLifecycle, useSetEventLifecycle } =
  createEventLifecycleHooks(api, { useQuery, useMutation });
