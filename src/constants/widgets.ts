import { ComponentType } from "react";
import { WidgetId } from "@constants/common";
import { IconProps } from "../types/common";
import ClockIcon from "@icons/Clock";
import ArtIcon from "@icons/Art";
import PlannerIcon from "@icons/Planner";

export interface WidgetMeta {
  id: WidgetId;
  name: string;
  icon: ComponentType<IconProps>;
  settingsCategory: string;
}

// Only widgets that appear in the dock (map to settings categories)
// DATE is not here because it's part of the Clock widget
export const WIDGET_REGISTRY: Partial<Record<WidgetId, WidgetMeta>> = {
  [WidgetId.CLOCK]: {
    id: WidgetId.CLOCK,
    name: "widgets.clock",
    icon: ClockIcon,
    settingsCategory: "Clock",
  },
  [WidgetId.ARTWORK_INFO]: {
    id: WidgetId.ARTWORK_INFO,
    name: "widgets.artworkInfo",
    icon: ArtIcon,
    settingsCategory: "Artwork",
  },
  [WidgetId.TODO]: {
    id: WidgetId.TODO,
    name: 'widgets.toDo',
    icon: PlannerIcon,
    settingsCategory: "Productivity",
  },
};

export const getEnabledWidgetIds = (
  widgets: Record<WidgetId, { enabled: boolean }>,
): WidgetId[] => {
  return Object.entries(widgets)
    .filter(([, state]) => state.enabled)
    .map(([id]) => id as WidgetId);
};
