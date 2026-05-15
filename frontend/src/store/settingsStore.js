import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  reset: () => set({ items: [], selected: null }),
}));

export { useSettingsStore };
export default useSettingsStore;
