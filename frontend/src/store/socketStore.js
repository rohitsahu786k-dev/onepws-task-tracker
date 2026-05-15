import { create } from 'zustand';

const useSocketStore = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  reset: () => set({ items: [], selected: null }),
}));

export { useSocketStore };
export default useSocketStore;
