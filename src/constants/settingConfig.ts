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
    {
      id: "artwork.filterByMood",
      label: "settings.artwork.filterByMood",
      type: FieldType.SWITCH,
    },
    {
      id: "artwork.mood",
      label: "settings.artwork.mood",
      type: FieldType.SELECT,
      items: [
        // Weather & Nature
        { value: "sunny", label: "settings.artwork.moods.sunny" },
        { value: "rainy", label: "settings.artwork.moods.rainy" },
        { value: "foggy", label: "settings.artwork.moods.foggy" },
        { value: "stormy", label: "settings.artwork.moods.stormy" },
        { value: "spring", label: "settings.artwork.moods.spring" },
        { value: "autumn", label: "settings.artwork.moods.autumn" },
        { value: "winter", label: "settings.artwork.moods.winter" },
        { value: "twilight", label: "settings.artwork.moods.twilight" },
        { value: "moonlight", label: "settings.artwork.moods.moonlight" },

        // Emotional
        { value: "joyful", label: "settings.artwork.moods.joyful" },
        { value: "melancholic", label: "settings.artwork.moods.melancholic" },
        { value: "nostalgic", label: "settings.artwork.moods.nostalgic" },
        { value: "mysterious", label: "settings.artwork.moods.mysterious" },
        { value: "romantic", label: "settings.artwork.moods.romantic" },
        { value: "contemplative", label: "settings.artwork.moods.contemplative" },
        { value: "serene", label: "settings.artwork.moods.serene" },

        // Energy & Intensity
        { value: "energetic", label: "settings.artwork.moods.energetic" },
        { value: "calm", label: "settings.artwork.moods.calm" },
        { value: "peaceful", label: "settings.artwork.moods.peaceful" },
        { value: "vibrant", label: "settings.artwork.moods.vibrant" },
        { value: "intense", label: "settings.artwork.moods.intense" },
        { value: "gentle", label: "settings.artwork.moods.gentle" },
        { value: "powerful", label: "settings.artwork.moods.powerful" },

        // Aesthetic & Atmosphere
        { value: "dramatic", label: "settings.artwork.moods.dramatic" },
        { value: "dreamy", label: "settings.artwork.moods.dreamy" },
        { value: "ethereal", label: "settings.artwork.moods.ethereal" },
        { value: "vintage", label: "settings.artwork.moods.vintage" },
        { value: "modern", label: "settings.artwork.moods.modern" },
        { value: "earthy", label: "settings.artwork.moods.earthy" },
        { value: "cosmic", label: "settings.artwork.moods.cosmic" },
        { value: "minimalist", label: "settings.artwork.moods.minimalist" },
        { value: "elegant", label: "settings.artwork.moods.elegant" },
        { value: "rustic", label: "settings.artwork.moods.rustic" },
        { value: "somber", label: "settings.artwork.moods.somber" },
      ],
      condition: (settings) => settings.artwork.filterByMood,
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
