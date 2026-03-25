import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────
interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
}

interface UIActions {
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

type UIStore = UIState & UIActions;

// ─── Store ────────────────────────────────────────────────────────
export const useUIStore = create<UIStore>((set) => ({
  // State
  isSidebarOpen: false,
  activeModal: null,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openModal: (id: string) => set({ activeModal: id }),

  closeModal: () => set({ activeModal: null }),
}));
