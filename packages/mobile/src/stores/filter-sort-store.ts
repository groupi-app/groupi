import { create } from 'zustand';

export type EventTab = 'upcoming' | 'attended';
export type EventScope = 'all' | 'mine';
export type SortBy = 'lastactivity' | 'eventdate' | 'createdat' | 'title';

interface FilterSortStore {
  activeTab: EventTab;
  eventScope: EventScope;
  sortBy: SortBy;
  setActiveTab: (tab: EventTab) => void;
  setEventScope: (scope: EventScope) => void;
  setSortBy: (sort: SortBy) => void;
}

export const useFilterSortStore = create<FilterSortStore>(set => ({
  activeTab: 'upcoming',
  eventScope: 'all',
  sortBy: 'lastactivity',
  setActiveTab: tab => set({ activeTab: tab }),
  setEventScope: eventScope => set({ eventScope }),
  setSortBy: sort => set({ sortBy: sort }),
}));
