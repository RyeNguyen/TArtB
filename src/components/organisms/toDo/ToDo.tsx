import { WidgetWrapper } from "@atoms/WidgetWrapper";
import { WidgetId } from "@constants/common";
import { useRef, createContext, useContext } from "react";
import { Confetti, ConfettiHandle } from "@atoms/Confetti";
import { useSettingsStore } from "@stores/settingsStore";
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
  const { settings } = useSettingsStore();
  const isFocused = settings.widgets[WidgetId.TODO]?.focused;
  const isEnabled = settings.widgets[WidgetId.TODO]?.enabled;
  const isVisible = settings.widgets[WidgetId.TODO]?.visible;

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
