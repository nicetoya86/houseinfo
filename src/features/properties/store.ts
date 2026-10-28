// Design Ref: §10.4 — single Zustand store for filter state (shared by filter panel + list)
import { create } from 'zustand';
import type { PropertyFilter } from '@/types/property';

interface PropertyFilterState {
  filter: PropertyFilter;
  setFilter: (patch: Partial<PropertyFilter>) => void;
  resetFilter: () => void;
}

const initialFilter: PropertyFilter = { page: 1, pageSize: 20 };

export const usePropertyFilterStore = create<PropertyFilterState>((set) => ({
  filter: initialFilter,
  setFilter: (patch) =>
    set((state) => ({ filter: { ...state.filter, ...patch, page: patch.page ?? 1 } })),
  resetFilter: () => set({ filter: initialFilter }),
}));
