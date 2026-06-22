import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number, action?: ToastAction) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, "id">>) => void;
  success: (message: string, duration?: number, action?: ToastAction) => string;
  error: (message: string, duration?: number, action?: ToastAction) => string;
  warning: (message: string, duration?: number, action?: ToastAction) => string;
  info: (message: string, duration?: number, action?: ToastAction) => string;
  loading: (message: string, action?: ToastAction) => string;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  
  addToast: (type, message, duration = 4000, action) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration, action };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove if not a loading toast and duration is specified
    if (type !== "loading" && duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  success: (message, duration, action) => {
    return get().addToast("success", message, duration, action);
  },

  error: (message, duration, action) => {
    return get().addToast("error", message, duration, action);
  },

  warning: (message, duration, action) => {
    return get().addToast("warning", message, duration, action);
  },

  info: (message, duration, action) => {
    return get().addToast("info", message, duration, action);
  },

  loading: (message, action) => {
    // Keep loading toasts active indefinitely (duration = 0) until resolved/removed manually
    return get().addToast("loading", message, 0, action);
  },
}));
