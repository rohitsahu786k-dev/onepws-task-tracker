import { create } from 'zustand';

const useWorkspaceStore = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  reset: () => set({ items: [], selected: null }),
}));

export { useWorkspaceStore };
export default useWorkspaceStore;
