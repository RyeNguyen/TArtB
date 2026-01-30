import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import {
  UserSettings,
  DEFAULT_SETTINGS,
  LegacyUserSettings,
  WidgetPosition,
} from "../types/settings";
import { WidgetId } from "@constants/common";
import { ClockType, Language, TimeFormat } from "@constants/common";

interface SettingsStore {
  settings: UserSettings;
  // Focus management (transient, not persisted)
  focusedWidgetId: WidgetId | null;
  focusOrder: WidgetId[];

  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  // Widget-specific actions
  toggleWidgetVisible: (widgetId: WidgetId) => void;
  setWidgetEnabled: (widgetId: WidgetId, enabled: boolean) => void;
  minimizeWidget: (widgetId: WidgetId) => void;
  closeWidget: (widgetId: WidgetId) => void;
  restoreWidget: (widgetId: WidgetId) => void;
  // Position and focus actions
  updateWidgetPosition: (widgetId: WidgetId, position: WidgetPosition) => void;
  focusWidget: (widgetId: WidgetId) => void;
}

// Helper to safely check Chrome extension environment
const getChromeStorage = () => {
  if (
    typeof window !== "undefined" &&
    typeof (window as any).chrome !== "undefined" &&
    (window as any).chrome?.storage?.sync
  ) {
    return (window as any).chrome.storage.sync;
  }
  return null;
};

// Chrome storage adapter for Zustand persist middleware
const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const storage = getChromeStorage();

    if (!storage) {
      // Fallback to localStorage for development
      return localStorage.getItem(name);
    }

    try {
      const result = await storage.get(name);
      return result[name] ? JSON.stringify(result[name]) : null;
    } catch (error) {
      console.error("Error getting item from Chrome storage:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const storage = getChromeStorage();

    if (!storage) {
      // Fallback to localStorage for development
      localStorage.setItem(name, value);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      await storage.set({ [name]: parsed });
    } catch (error) {
      console.error("Error setting item in Chrome storage:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    const storage = getChromeStorage();

    if (!storage) {
      // Fallback to localStorage for development
      localStorage.removeItem(name);
      return;
    }

    try {
      await storage.remove(name);
    } catch (error) {
      console.error("Error removing item from Chrome storage:", error);
    }
  },
};

// Deep merge helper for nested objects
const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T => {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
};

// Check if settings are in legacy flat format
const isLegacySettings = (state: any): state is { settings: LegacyUserSettings } => {
  return state?.settings && "showClock" in state.settings;
};

// Migrate from legacy flat structure to new grouped structure
const migrateSettings = (legacy: LegacyUserSettings): UserSettings => {
  return {
    widgets: {
      [WidgetId.CLOCK]: {
        enabled: legacy.showClock ?? true,
        visible: true,
        type: legacy.clockType ?? ClockType.DIGITAL,
        timeFormat: legacy.timeFormat ?? TimeFormat.H12,
      },
      [WidgetId.DATE]: {
        enabled: legacy.showDate ?? true,
        visible: true,
      },
      [WidgetId.GREETING]: {
        enabled: legacy.showGreeting ?? true,
        visible: true,
      },
      [WidgetId.ARTWORK_INFO]: {
        enabled: legacy.showArtworkInfo ?? true,
        visible: true,
      },
    },
    artwork: {
      museum: legacy.artMuseum ?? "wikiart",
      changeInterval: legacy.artChangeInterval ?? 30,
    },
    app: {
      language: legacy.language ?? Language.EN,
    },
  };
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      // Focus management (transient, not persisted)
      focusedWidgetId: null,
      focusOrder: Object.values(WidgetId),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: deepMerge(state.settings, newSettings),
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      // Toggle widget visibility (click on dock icon)
      toggleWidgetVisible: (widgetId: WidgetId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                visible: !state.settings.widgets[widgetId].visible,
              },
            },
          },
        })),

      // Set widget enabled state (from settings panel)
      setWidgetEnabled: (widgetId: WidgetId, enabled: boolean) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                enabled,
                // When enabling, also make visible
                visible: enabled ? true : state.settings.widgets[widgetId].visible,
              },
            },
          },
        })),

      // Minimize widget (yellow dot) - hide but keep in dock
      minimizeWidget: (widgetId: WidgetId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                visible: false,
              },
            },
          },
        })),

      // Close widget (red dot) - disable and remove from dock
      closeWidget: (widgetId: WidgetId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                enabled: false,
                visible: false,
              },
            },
          },
        })),

      // Restore widget from dock (make visible again)
      restoreWidget: (widgetId: WidgetId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                visible: true,
              },
            },
          },
        })),

      // Update widget position after dragging
      updateWidgetPosition: (widgetId: WidgetId, position: WidgetPosition) =>
        set((state) => ({
          settings: {
            ...state.settings,
            widgets: {
              ...state.settings.widgets,
              [widgetId]: {
                ...state.settings.widgets[widgetId],
                position,
              },
            },
          },
        })),

      // Focus widget (bring to front)
      focusWidget: (widgetId: WidgetId) =>
        set((state) => {
          const newFocusOrder = state.focusOrder.filter((id) => id !== widgetId);
          newFocusOrder.push(widgetId);
          return {
            focusedWidgetId: widgetId,
            focusOrder: newFocusOrder,
          };
        }),
    }),
    {
      name: "tartb-settings",
      version: 1,
      storage: createJSONStorage(() => chromeStorage),
      // Only persist settings, not transient UI state
      partialize: (state) => ({ settings: state.settings }),
      migrate: (persistedState: unknown, version: number) => {
        // Migration from version 0 (legacy flat structure) to version 1 (grouped)
        if (version === 0 && isLegacySettings(persistedState)) {
          console.log("Migrating settings from legacy format...");
          return {
            settings: migrateSettings(persistedState.settings),
            // settings: () => {},
          };
        }
        return persistedState as { settings: UserSettings };
      },
    },
  ),
);
