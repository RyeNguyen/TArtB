import { useRef } from "react";
import { motion } from "framer-motion";
import { Glass } from "@atoms/Glass";
import { useSettingsStore } from "@stores/settingsStore";
import { WidgetId } from "@constants/common";
import { WIDGET_REGISTRY, WidgetMeta } from "@constants/widgets";

interface DockStationProps {
  className?: string;
  onOpenSettings?: (category: string) => void;
}

interface DockIconProps {
  widget: WidgetMeta;
  isVisible: boolean;
  onClick: () => void;
  onLongPress: () => void;
}

const LONG_PRESS_DURATION = 400;

const DockIcon = ({
  widget,
  isVisible,
  onClick,
  onLongPress,
}: DockIconProps) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleMouseDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress.current) {
      onClick();
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const Icon = widget.icon;

  return (
    <motion.div
      className={`p-3 cursor-pointer transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-40"
      }`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      whileHover={{ scale: 1.3, y: -10 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Icon />
    </motion.div>
  );
};

export const DockStation = ({
  className,
  onOpenSettings,
}: DockStationProps) => {
  const { settings, toggleWidgetVisible, focusWidget, enterFocusMode } = useSettingsStore();

  // Filter to only dock widgets that exist in registry AND are enabled
  const enabledWidgets = Object.entries(WIDGET_REGISTRY)
    .filter((entry): entry is [string, WidgetMeta] => entry[1] !== undefined)
    .filter(([id]) => settings.widgets[id as WidgetId]?.enabled);

  if (enabledWidgets.length === 0) {
    return null;
  }

  const handleIconClick = (widgetId: WidgetId) => {
    const widget = settings.widgets[widgetId];
    const isFocused = widget.focused;
    const isVisible = widget.visible;

    // Check if another widget is currently in focus mode
    const focusedWidget = settings.focusedWidget;
    const anotherWidgetIsFocused = focusedWidget && focusedWidget !== widgetId;

    if (isFocused && isVisible) {
      // Clicking the currently focused widget - minimize it (keep focused state)
      toggleWidgetVisible(widgetId);
    } else if (anotherWidgetIsFocused) {
      // Another widget is in focus mode - switch to this widget in focus mode
      if (!isVisible) {
        // If this widget is minimized, restore it first
        toggleWidgetVisible(widgetId);
      }
      // Switch focus to this widget (will unfocus the other)
      enterFocusMode(widgetId);
    } else if (!isVisible) {
      // Widget is minimized, no other widget focused - restore to previous state
      toggleWidgetVisible(widgetId);
      if (isFocused) {
        // Was in focus mode before minimizing, restore focus mode
        enterFocusMode(widgetId);
      } else {
        // Was in normal mode, just bring to front
        focusWidget(widgetId);
      }
    } else {
      // Widget is visible but not focused, no other widget focused - just minimize
      toggleWidgetVisible(widgetId);
    }
  };

  const handleLongPress = (widget: WidgetMeta) => {
    onOpenSettings?.(widget.settingsCategory);
  };

  return (
    <Glass
      className={`fixed! bottom-4 left-1/2 -translate-x-1/2 px-2 py-1 ${className}`}
      style={{ zIndex: 70 }}
    >
      <div className="flex gap-1 items-center">
        {enabledWidgets.map(([id, widget]) => (
          <DockIcon
            key={id}
            widget={widget}
            isVisible={settings.widgets[id as WidgetId].visible}
            onClick={() => handleIconClick(id as WidgetId)}
            onLongPress={() => handleLongPress(widget)}
          />
        ))}
      </div>
    </Glass>
  );
};
