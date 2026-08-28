import { create } from 'zustand';

export type NotificationFilter = 'all' | 'unread';

interface NotificationStore {
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
}

export const useNotificationStore = create<NotificationStore>(set => ({
  filter: 'all',
  setFilter: filter => set({ filter }),
}));
