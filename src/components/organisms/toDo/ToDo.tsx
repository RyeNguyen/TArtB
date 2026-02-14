import { WidgetWrapper } from "@atoms/WidgetWrapper";
import { WidgetId } from "@constants/common";
import { useRef, createContext, useContext, useEffect } from "react";
import { Confetti, ConfettiHandle } from "@atoms/Confetti";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodoStore } from "@stores/todoStore";
import { ToDoCompactMode } from "@organisms/toDo/compactMode/ToDoCompactMode";
import { ToDoFocusMode } from "@organisms/toDo/focusMode/ToDoFocusMode";

// Context to share confetti trigger with child components
const ConfettiContext = createContext<
  ((x?: number, y?: number) => void) | null
>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  return context;
};

export const ToDo = () => {
  const confettiRef = useRef<ConfettiHandle>(null);
  const { settings, updateSettings } = useSettingsStore();
  const { lists } = useTodoStore();
  const isFocused = settings.widgets[WidgetId.TODO]?.focused;
  const isEnabled = settings.widgets[WidgetId.TODO]?.enabled;
  const isVisible = settings.widgets[WidgetId.TODO]?.visible;
  const toDoSettings = settings.widgets[WidgetId.TODO];

  // Clear tag filter and restore list selection when returning to compact mode
  useEffect(() => {
    if (!isFocused && toDoSettings.selectedTagId) {
      // Sort lists by order to get the first list
      const sortedLists = [...lists].sort((a, b) => a.order - b.order);
      const firstListId = sortedLists.length > 0 ? sortedLists[0].id : null;

      updateSettings({
        widgets: {
          ...settings.widgets,
          [WidgetId.TODO]: {
            ...toDoSettings,
            selectedTagId: null,
            selectedListId: firstListId,
          },
        },
      });
    }
  }, [isFocused, toDoSettings, settings.widgets, updateSettings, lists]);

  if (!isEnabled || !isVisible) return null;

  const fireConfetti = (x?: number, y?: number) =>
    confettiRef.current?.fire(x, y);

  return (
    <ConfettiContext.Provider value={fireConfetti}>
      <WidgetWrapper
        widgetId={WidgetId.TODO}
        wrapperClassName={`${isFocused ? "flex! flex-col!" : ""}`}
        innerGlassClassName={`${isFocused ? "h-full!" : ""}`}
      >
        <Confetti ref={confettiRef} />

        {isFocused ? <ToDoFocusMode /> : <ToDoCompactMode />}
      </WidgetWrapper>
    </ConfettiContext.Provider>
  );
};
