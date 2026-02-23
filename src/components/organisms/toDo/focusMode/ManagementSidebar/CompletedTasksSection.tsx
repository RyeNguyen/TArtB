import { Typography } from "@atoms/Typography";
import { WidgetId } from "@constants/common";
import CheckCircleIcon from "@icons/CheckCircle";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodoStore } from "@stores/todoStore";

export const CompletedTasksSection = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { tasks, setSelectedTask } = useTodoStore();
  const toDoSettings = settings.widgets[WidgetId.TODO];

  const completedTasksCount = tasks.filter(
    (t) => t.isCompleted && !t.deletedAt,
  ).length;

  const handleSelectCompleted = () => {
    setSelectedTask(null);
    // Clear all other filters and show completed tasks view
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedListId: null,
          selectedTagId: null,
          showCompleted: true,
          showDeleted: false,
        },
      },
    });
  };

  const isActive =
    toDoSettings.showCompleted &&
    !toDoSettings.selectedListId &&
    !toDoSettings.selectedTagId;

  return (
    <div className="p-2 border-t border-white/20">
      <div
        className={`flex p-1 rounded-xl gap-1 hover:bg-white/10 items-center justify-between min-w-0 overflow-hidden cursor-pointer ${
          isActive ? "bg-white/20 text-white" : ""
        }`}
        onClick={handleSelectCompleted}
      >
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <CheckCircleIcon />
          <Typography className="text-text-color truncate">
            Completed
          </Typography>
        </div>
        {completedTasksCount > 0 && (
          <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
            {completedTasksCount}
          </div>
        )}
      </div>
    </div>
  );
};
