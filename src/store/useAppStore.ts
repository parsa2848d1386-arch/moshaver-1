import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  chatType: 'shared' | 'private';
  setChatType: (type: 'shared' | 'private') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      chatType: 'shared',
      setChatType: (chatType) => set({ chatType }),
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'moshaver-storage',
      partialize: (state) => ({ theme: state.theme, chatType: state.chatType }),
    }
  )
);
