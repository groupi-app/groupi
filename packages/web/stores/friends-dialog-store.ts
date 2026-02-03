'use client';

import { create } from 'zustand';

type FriendsDialogTab = 'friends' | 'requests' | 'add';

interface FriendsDialogStore {
  open: boolean;
  defaultTab: FriendsDialogTab;
  openDialog: (tab?: FriendsDialogTab) => void;
  closeDialog: () => void;
  setOpen: (open: boolean) => void;
}

export const useFriendsDialogStore = create<FriendsDialogStore>(set => ({
  open: false,
  defaultTab: 'friends',
  openDialog: (tab = 'friends') => set({ open: true, defaultTab: tab }),
  closeDialog: () => set({ open: false }),
  setOpen: open => set({ open }),
}));
