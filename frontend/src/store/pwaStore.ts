import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QueuedNote {
  id: string;
  candidateId: string;
  noteText: string;
  timestamp: number;
}

interface PWAState {
  isOnline: boolean;
  installPrompt: any; // BeforeInstallPromptEvent
  isInstalled: boolean;
  syncQueue: QueuedNote[];
  setOnline: (online: boolean) => void;
  setInstallPrompt: (prompt: any) => void;
  setInstalled: (installed: boolean) => void;
  queueOfflineNote: (candidateId: string, noteText: string) => void;
  removeQueuedNote: (id: string) => void;
  clearSyncQueue: () => void;
}

export const usePWAStore = create<PWAState>()(
  persist(
    (set) => ({
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      installPrompt: null,
      isInstalled: false,
      syncQueue: [],

      setOnline: (online) => set({ isOnline: online }),
      
      setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
      
      setInstalled: (installed) => set({ isInstalled: installed, installPrompt: null }),

      queueOfflineNote: (candidateId, noteText) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNote: QueuedNote = {
          id,
          candidateId,
          noteText,
          timestamp: Date.now(),
        };
        set((state) => ({
          syncQueue: [...state.syncQueue, newNote],
        }));
      },

      removeQueuedNote: (id) => {
        set((state) => ({
          syncQueue: state.syncQueue.filter((note) => note.id !== id),
        }));
      },

      clearSyncQueue: () => set({ syncQueue: [] }),
    }),
    {
      name: "antigravity-pwa-store",
      // Only persist connection queue, do not persist the raw DOM install prompt event
      partialize: (state) => ({
        syncQueue: state.syncQueue,
        isInstalled: state.isInstalled,
      }),
    }
  )
);
