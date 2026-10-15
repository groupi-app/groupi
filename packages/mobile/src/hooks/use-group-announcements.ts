import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupAnnouncementHooks } from '@groupi/shared/hooks';
export const { useAnnouncement, useSendAnnouncement } =
  createGroupAnnouncementHooks(api, { useQuery, useMutation });
