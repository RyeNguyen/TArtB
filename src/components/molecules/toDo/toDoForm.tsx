import { Button } from "@atoms/button/Button";
import { DatePicker } from "@atoms/DatePicker";
import { Dropdown } from "@atoms/Dropdown";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TaskPriorityType } from "@constants/common";

import { getPriorityConfig } from "@constants/toDoConfig";
import { useTodo } from "@hooks/useToDo";
import CalendarIcon from "@icons/Calendar";
import FlagIcon from "@icons/Flag";
import PlusIcon from "@icons/Plus";
import TagIcon from "@icons/Tag";
import { useTranslation } from "react-i18next";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import RefreshIcon from "@icons/Refresh";
import { useMemo } from "react";

const localeMap: Record<string, Locale> = { vi, en: enUS };
const shortDateFormatMap: Record<string, string> = {
  vi: "d MMM",
  en: "MMM d",
};
const CREATE_TAG_VALUE = "createTag";

export const ToDoForm = () => {
  const { t, i18n } = useTranslation();
  const priorityConfig = getPriorityConfig();
  const {
    priority,
    setPriority,
    deadline,
    setDeadline,
    inputValue,
    setInputValue,
    setIsInputFocused,
    tagSearchTerm,
    setTagSearchTerm,
    loading,

    handleAddTask,
    handleBlur,
  } = useTodo();

  const isAdding = loading.isAddingTask;

  const getDeadlineLabel = (): string => {
    if (!deadline) return t("toDo.deadline.noDate");
    const date = new Date(deadline);
    if (isToday(date)) return t("toDo.deadline.today");
    if (isTomorrow(date)) return t("toDo.deadline.tomorrow");
    const dateFormat =
      shortDateFormatMap[i18n.language] || shortDateFormatMap.en;
    return format(date, dateFormat, {
      locale: localeMap[i18n.language] || enUS,
    });
  };

  const priorityData = [
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.ERROR_400} />
          <Typography className="text-white">
            {t("toDo.priority.high")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.HIGH,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.WARNING_400} />
          <Typography className="text-white">
            {t("toDo.priority.medium")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.MEDIUM,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.BLUE_400} />
          <Typography className="text-white">
            {t("toDo.priority.low")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.LOW,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon />
          <Typography className="text-white">
            {t("toDo.priority.none")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.NONE,
    },
  ];

  const tagsData = useMemo(() => {
    return [
      {
        label: (
          <div className="w-full flex items-center gap-1">
            <PlusIcon />
            <Typography className="truncate flex-1">
              {t("toDo.list.createNew", { listName: tagSearchTerm })}
            </Typography>
          </div>
        ),
        value: CREATE_TAG_VALUE,
      },
    ];
  }, [t, tagSearchTerm]);

  return (
    <form onSubmit={handleAddTask} className="relative flex items-center gap-2">
      <div
        onFocus={() => setIsInputFocused(true)}
        onBlur={handleBlur}
        className="w-full flex flex-col gap-2 bg-white/50 rounded-2xl p-1"
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("toDo.inputPlaceholder")}
          className="ml-2 text-gray-300 font-light text-sz-default placeholder:text-grey-300/50 outline-none"
          disabled={isAdding}
        />
        {/* {isInputFocused && ( */}
        <div className="flex gap-2">
          <DatePicker value={deadline} onChange={setDeadline}>
            <Button
              type="button"
              icon={CalendarIcon}
              text={getDeadlineLabel()}
              textClassName="text-gray-300!"
              style={deadline ? { backgroundColor: COLORS.BLUE_50 } : undefined}
            />
          </DatePicker>

          <Dropdown
            data={priorityData}
            value={priority}
            header={t("toDo.priority.title")}
            onChange={(value: string) => setPriority(value as TaskPriorityType)}
          >
            <Button
              type="button"
              icon={FlagIcon}
              color={priorityConfig[priority].color}
              text={priorityConfig[priority].label}
              textClassName="text-gray-300!"
              style={{ backgroundColor: priorityConfig[priority].bgColor }}
            />
          </Dropdown>

          <Dropdown
            data={tagsData}
            menuClassName="max-w-80"
            header={
              <div className="w-full flex gap-2 items-center mb-2 pb-2 border-b border-white/20">
                <RefreshIcon size={16} />
                <input
                  value={tagSearchTerm}
                  placeholder={t("toDo.list.searchPlaceholder")}
                  className="w-full outline-none text-white font-light text-sz-default"
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            <Button
              type="button"
              textClassName="text-gray-300!"
              icon={TagIcon}
              text="None"
            />
          </Dropdown>
        </div>
        {/* )} */}
      </div>

      <Button
        icon={PlusIcon}
        iconColor={COLORS.WHITE}
        type="submit"
        className="p-1! bg-transparent!"
        disabled={isAdding}
      />

      {isAdding && (
        <div className="absolute inset-0 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        </div>
      )}
    </form>
  );
};
