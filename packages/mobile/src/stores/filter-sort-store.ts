import { create } from 'zustand';

export type EventTab = 'upcoming' | 'hosting' | 'attended';
export type SortBy = 'lastactivity' | 'eventdate' | 'createdat' | 'title';

interface FilterSortStore {
  activeTab: EventTab;
  sortBy: SortBy;
  setActiveTab: (tab: EventTab) => void;
  setSortBy: (sort: SortBy) => void;
}

export const useFilterSortStore = create<FilterSortStore>(set => ({
  activeTab: 'upcoming',
  sortBy: 'lastactivity',
  setActiveTab: tab => set({ activeTab: tab }),
  setSortBy: sort => set({ sortBy: sort }),
}));
