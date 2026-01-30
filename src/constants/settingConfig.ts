import { ClockType, FieldType, Language, TimeFormat } from "@constants/common";
import { SettingField } from "../types/settings";
import { WidgetId } from "@constants/common";

const widgetPath = (widgetId: WidgetId, field: string) =>
  `widgets.${widgetId}.${field}`;
const appPath = (field: string) => `app.${field}`;

export const SETTINGS_CONFIG: Record<string, SettingField[]> = {
  Artwork: [
    {
      id: widgetPath(WidgetId.ARTWORK_INFO, "enabled"),
      label: "settings.artwork.showArtworkInfo",
      type: FieldType.SWITCH,
    },
  ],
  Clock: [
    {
      id: widgetPath(WidgetId.CLOCK, "enabled"),
      label: "settings.clock.showClock",
      type: FieldType.SWITCH,
    },
    {
      id: widgetPath(WidgetId.DATE, "enabled"),
      label: "settings.clock.showDate",
      type: FieldType.SWITCH,
    },
    {
      id: widgetPath(WidgetId.GREETING, "enabled"),
      label: "settings.clock.showGreeting",
      type: FieldType.SWITCH,
    },
    {
      id: widgetPath(WidgetId.CLOCK, "type"),
      label: "settings.clock.clockType",
      type: FieldType.SELECT,
      items: [
        { value: ClockType.DIGITAL, label: "settings.clock.digital" },
        { value: ClockType.ANALOG, label: "settings.clock.analog" },
      ],
      condition: (settings) => settings.widgets[WidgetId.CLOCK].enabled,
    },
    {
      id: widgetPath(WidgetId.CLOCK, "timeFormat"),
      label: "settings.clock.timeFormat",
      type: FieldType.SELECT,
      items: [
        { value: TimeFormat.H12, label: "settings.clock.12hour" },
        { value: TimeFormat.H24, label: "settings.clock.24hour" },
      ],
      condition: (settings) =>
        settings.widgets[WidgetId.CLOCK].enabled &&
        settings.widgets[WidgetId.CLOCK].type === ClockType.DIGITAL,
    },
  ],
  Productivity: [
    {
      id: widgetPath(WidgetId.TODO, "enabled"),
      label: "settings.productivity.showToDo",
      type: FieldType.SWITCH,
    },
  ],
  Other: [
    {
      id: appPath("language"),
      label: "settings.other.displayLanguage",
      type: FieldType.SELECT,
      items: [
        { value: Language.EN, label: "settings.other.english" },
        { value: Language.VI, label: "settings.other.vietnamese" },
      ],
    },
  ],
} as const;
