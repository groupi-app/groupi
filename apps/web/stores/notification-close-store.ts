'use client';

import { create } from 'zustand';

interface NotificationCloseStore {
  popoverOpen: boolean;
  sheetOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  setSheetOpen: (open: boolean) => void;
}

export const useNotificationCloseStore = create<NotificationCloseStore>((set) => ({
  popoverOpen: false,
  sheetOpen: false,
  setPopoverOpen: (open) => set({ popoverOpen: open }),
  setSheetOpen: (open) => set({ sheetOpen: open }),
}));

