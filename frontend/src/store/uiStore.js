import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  activeModal: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
  reset: () => set({ sidebarOpen: true, commandPaletteOpen: false, activeModal: null }),
}));

export { useUiStore };
export default useUiStore;
