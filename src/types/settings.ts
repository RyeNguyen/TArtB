import {
  ClockType,
  FieldType,
  Language,
  TaskGroupBy,
  TaskSortBy,
  TimeFormat,
  WidgetId,
} from "@constants/common";
import { ParseKeys } from "i18next";

export interface WidgetPosition {
  x: number;
  y: number;
}

interface BaseWidgetState {
  enabled: boolean;
  visible: boolean;
  focused: boolean;
  position?: WidgetPosition;
}

export interface ClockWidgetState extends BaseWidgetState {
  type: ClockType;
  timeFormat: TimeFormat;
}

export interface DateWidgetState extends BaseWidgetState {}

export interface GreetingWidgetState extends BaseWidgetState {}

export interface ArtworkInfoWidgetState extends BaseWidgetState {}

export interface ToDoWidgetState extends BaseWidgetState {
  selectedListId: string | null;
  sortBy: TaskSortBy;
  groupBy: TaskGroupBy;
}

export interface WidgetStates {
  [WidgetId.CLOCK]: ClockWidgetState;
  [WidgetId.DATE]: DateWidgetState;
  [WidgetId.GREETING]: GreetingWidgetState;
  [WidgetId.ARTWORK_INFO]: ArtworkInfoWidgetState;
  [WidgetId.TODO]: ToDoWidgetState;
}

// Artwork settings (non-widget specific)
export interface ArtworkSettings {
  museum: "artic" | "met" | "wikiart" | "random";
  changeInterval: number; // in minutes
  mood?: string; // Selected mood filter (rainy, sunny, calm, etc.)
  filterByMood: boolean; // Enable/disable mood filtering
}

export interface AppSettings {
  language: Language;
}

export interface UserSettings {
  widgets: WidgetStates;
  artwork: ArtworkSettings;
  app: AppSettings;
  focusedWidget: WidgetId | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
  widgets: {
    [WidgetId.CLOCK]: {
      enabled: true,
      visible: true,
      focused: false,
      type: ClockType.DIGITAL,
      timeFormat: TimeFormat.H12,
    },
    [WidgetId.DATE]: {
      enabled: true,
      visible: true,
      focused: false,
    },
    [WidgetId.GREETING]: {
      enabled: false,
      visible: false,
      focused: false,
    },
    [WidgetId.ARTWORK_INFO]: {
      enabled: true,
      visible: true,
      focused: false,
    },
    [WidgetId.TODO]: {
      enabled: false,
      visible: true,
      focused: false,
      selectedListId: null,
      sortBy: TaskSortBy.MANUAL,
      groupBy: TaskGroupBy.NONE,
    },
  },
  artwork: {
    museum: "wikiart",
    changeInterval: 30,
    mood: undefined,
    filterByMood: false,
  },
  app: {
    language: Language.EN,
  },
  focusedWidget: null,
};

export type SettingField = {
  id: string;
  label: ParseKeys;
  type: FieldType;
  description?: string;
  items?: {
    value: string;
    label: string;
  }[];
  condition?: (settings: UserSettings) => boolean;
};

export type SettingCategory = {
  id: string;
  fields: SettingField[];
};
