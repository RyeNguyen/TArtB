export enum TypoVariants {
  DEFAULT = "default",
  DESCRIPTION = "description",
  SUBTITLE = "subtitle",
  TITLE = "title",
  TITLE_XL = "title_xl",
}

export enum WidgetId {
  CLOCK = "clock",
  DATE = "date",
  ARTWORK_INFO = "artworkInfo",
  GREETING = "greeting",
  TODO = "toDo",
  // Future widgets
  // WEATHER = "weather",
  // QUOTE = "quote",
}

export enum TimeFormat {
  H12 = "12h",
  H24 = "24h",
}

export enum ClockType {
  ANALOG = "analog",
  DIGITAL = "digital",
}

export enum Language {
  EN = "en",
  VI = "vi",
}

export enum FieldType {
  SWITCH = "switch",
  SELECT = "select",
}

export enum DayTimeType {
  MORNING = "morning",
  AFTERNOON = "afternoon",
  EVENING = "evening",
  NIGHT = "night",
}

export enum TaskPriorityType {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  NONE = "none",
}

export enum TaskSortBy {
  DATE = "date",
  DUE_DATE = "dueDate",
  PRIORITY = "priority",
  TITLE = "title",
  MANUAL = "manual",
}

export enum TaskGroupBy {
  NONE = "none",
  PRIORITY = "priority",
  TAGS = "tags",
  DATE = "date",
  DUE_DATE = "dueDate",
}

export enum OtherTaskActions {
  DUPLICATE = "duplicate",
  DELETE = "delete",
}

export enum ListActions {
  EDIT = "edit",
  DUPLICATE = "duplicate",
  DELETE = "delete",
}

export enum ModalType {
  NONE = "none",
  ADD = "add",
  EDIT = "edit",
  DELETE = "delete",
  NOTIFY = "notify",
  DUPLICATE = "duplicate",
}
