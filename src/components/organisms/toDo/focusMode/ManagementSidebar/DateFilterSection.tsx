import { Typography } from "@atoms/Typography";
import { DateFilter, WidgetId } from "@constants/common";
import CalendarIcon from "@icons/Calendar";
import CalendarDayIcon from "@icons/CalendarDay";
import CalendarWeekIcon from "@icons/CalendarWeek";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodoStore } from "@stores/todoStore";
import { useTranslation } from "react-i18next";

export const DateFilterSection = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const { setSelectedTask } = useTodoStore();
  const toDoSettings = settings.widgets[WidgetId.TODO];

  const handleSelectDateFilter = (filter: DateFilter) => {
    setSelectedTask(null);
    const updates: Partial<typeof toDoSettings> = {
      dateFilter: filter,
      selectedListId: null,
      selectedTagId: null,
      showCompleted: false,
      showDeleted: false,
    };

    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          ...updates,
        },
      },
    });
  };

  const filters = [
    {
      value: DateFilter.ALL,
      label: t("toDo.dateFilter.all"),
      icon: CalendarIcon,
    },
    {
      value: DateFilter.TODAY,
      label: t("toDo.dateFilter.today"),
      icon: CalendarDayIcon,
    },
    {
      value: DateFilter.NEXT_7_DAYS,
      label: t("toDo.dateFilter.next7Days"),
      icon: CalendarWeekIcon,
    },
  ];

  return (
    <div className="p-2 border-b border-white/20">
      <div className="flex flex-col gap-1">
        {filters.map((filter) => {
          const isActive =
            !toDoSettings.selectedListId &&
            !toDoSettings.selectedTagId &&
            !toDoSettings.showCompleted &&
            !toDoSettings.showDeleted &&
            toDoSettings.dateFilter === filter.value;
          const Icon = filter.icon;

          return (
            <div
              key={filter.value}
              className={`flex p-1 rounded-xl gap-1 hover:bg-white/10 items-center min-w-0 overflow-hidden cursor-pointer ${
                isActive ? "bg-white/20 text-white" : ""
              }`}
              onClick={() => handleSelectDateFilter(filter.value)}
            >
              <Icon />

              <Typography className="text-text-color truncate">
                {filter.label}
              </Typography>
            </div>
          );
        })}
      </div>
    </div>
  );
};
