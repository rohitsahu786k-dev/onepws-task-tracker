import { create } from 'zustand';

const useTimerStore = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  reset: () => set({ items: [], selected: null }),
}));

export { useTimerStore };
export default useTimerStore;
