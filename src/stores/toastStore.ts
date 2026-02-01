import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (
    toast: Omit<Toast, "id">,
  ) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const DEFAULT_DURATION = {
  success: 3000,
  error: 5000,
  info: 4000,
};

const generateToastId = () => `toast-${Date.now()}-${Math.random()}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const { toasts } = get();

    // Prevent duplicate toasts
    const existing = toasts.find(
      (t) => t.message === toast.message && t.type === toast.type,
    );

    if (existing) return existing.id;

    const id = generateToastId();
    const duration = toast.duration ?? DEFAULT_DURATION[toast.type];

    const newToast: Toast = {
      ...toast,
      id,
      duration,
    };

    // Limit to max 3 toasts visible
    const updatedToasts = [...toasts, newToast].slice(-3);

    set({ toasts: updatedToasts });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));
