import { Typography } from "@atoms/Typography";
import { WidgetId } from "@constants/common";
import DeleteIcon from "@icons/Delete";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodoStore } from "@stores/todoStore";

export const DeletedTasksSection = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { tasks } = useTodoStore();
  const toDoSettings = settings.widgets[WidgetId.TODO];

  const deletedTasksCount = tasks.filter((t) => t.deletedAt).length;

  const handleSelectDeleted = () => {
    // Clear all other filters and show deleted tasks view
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedListId: null,
          selectedTagId: null,
          showCompleted: false,
          showDeleted: true,
        },
      },
    });
  };

  const isActive =
    toDoSettings.showDeleted &&
    !toDoSettings.selectedListId &&
    !toDoSettings.selectedTagId;

  return (
    <div className="p-2">
      <div
        className={`flex p-1 rounded-xl gap-1 hover:bg-white/10 items-center justify-between min-w-0 overflow-hidden cursor-pointer ${
          isActive ? "bg-white/20 text-white" : ""
        }`}
        onClick={handleSelectDeleted}
      >
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <DeleteIcon />
          <Typography className="text-text-color truncate">
            Deleted
          </Typography>
        </div>
        {deletedTasksCount > 0 && (
          <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
            {deletedTasksCount}
          </div>
        )}
      </div>
    </div>
  );
};
