'use client';

import { create } from 'zustand';

export type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';
export type Filter = 'all' | 'my';

interface FilterSortStore {
  sortBy: SortBy;
  filter: Filter;
  setSortBy: (value: SortBy) => void;
  setFilter: (value: Filter) => void;
}

export const useFilterSortStore = create<FilterSortStore>(set => ({
  sortBy: 'lastactivity',
  filter: 'all',
  setSortBy: value => set({ sortBy: value }),
  setFilter: value => set({ filter: value }),
}));
