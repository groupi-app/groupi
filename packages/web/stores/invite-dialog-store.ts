'use client';

import { create } from 'zustand';
import { Id } from '@/convex/_generated/dataModel';

type InviteDialogTab = 'link' | 'email' | 'username';

interface InviteDialogStore {
  open: boolean;
  eventId: Id<'events'> | null;
  defaultTab: InviteDialogTab;
  openDialog: (eventId: Id<'events'>, tab?: InviteDialogTab) => void;
  closeDialog: () => void;
  setOpen: (open: boolean) => void;
  setTab: (tab: InviteDialogTab) => void;
}

export const useInviteDialogStore = create<InviteDialogStore>(set => ({
  open: false,
  eventId: null,
  defaultTab: 'link',
  openDialog: (eventId, tab = 'link') =>
    set({ open: true, eventId, defaultTab: tab }),
  closeDialog: () => set({ open: false, eventId: null }),
  setOpen: open => set(state => (open ? state : { open, eventId: null })),
  setTab: defaultTab => set({ defaultTab }),
}));
