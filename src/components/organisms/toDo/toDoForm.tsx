import { Button } from "@atoms/button/Button";
import { DatePicker } from "@atoms/DatePicker";
import { COLORS } from "@constants/colors";
import { TaskPriorityType } from "@constants/common";

import { getPriorityConfig, shortDateFormatMap } from "@constants/toDoConfig";
import { useTodo } from "@hooks/useToDo";
import CalendarIcon from "@icons/Calendar";
import FlagIcon from "@icons/Flag";
import PlusIcon from "@icons/Plus";
import TagIcon from "@icons/Tag";
import { useTranslation } from "react-i18next";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useMemo } from "react";
import { useTodoStore } from "@stores/todoStore";
import { PrioritySelector } from "@molecules/toDo/PrioritySelector";
import { TagSelector } from "@molecules/toDo/TagSelector";

const localeMap: Record<string, Locale> = { vi, en: enUS };
const CREATE_TAG_VALUE = "createTag";

export const ToDoForm = () => {
  const { t, i18n } = useTranslation();
  const priorityConfig = getPriorityConfig();
  const { addTag } = useTodoStore();
  const {
    tags,
    priority,
    setPriority,
    deadline,
    setDeadline,
    inputValue,
    setInputValue,
    setIsInputFocused,
    tagSearchTerm,
    setTagSearchTerm,
    selectedTags,
    handleSelectTag,
    loading,
    handleAddTask,
    handleBlur,
  } = useTodo();

  const isAdding = loading.isAddingTask;

  const firstTag = useMemo(
    () => tags.find((item) => item.id === selectedTags[0]),
    [selectedTags, tags],
  );

  const displayTag = useMemo(() => {
    if (selectedTags.length === 1) return `#${firstTag?.title}`;
    if (selectedTags.length > 1)
      return `#${firstTag?.title} + ${selectedTags.length - 1}`;
    return t("toDo.tag.none");
  }, [firstTag?.title, selectedTags.length, t]);

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

  const onSelectTag = async (tagId: string) => {
    if (!tagId) return;
    if (tagId === CREATE_TAG_VALUE) {
      const newTagId = await addTag(tagSearchTerm, COLORS.BLUE_50);
      handleSelectTag(newTagId);
      setTagSearchTerm("");
    } else {
      handleSelectTag(tagId);
    }
  };

  return (
    <form onSubmit={handleAddTask} className="relative flex items-center gap-2">
      <div
        onFocus={() => setIsInputFocused(true)}
        onBlur={handleBlur}
        className="w-full flex flex-1 flex-col gap-2 bg-white/50 rounded-2xl p-1"
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("toDo.inputPlaceholder")}
          className="flex-1 ml-2 text-gray-300 font-light text-sz-default placeholder:text-grey-300/50 outline-none"
          disabled={isAdding}
        />

        {/* {isInputFocused && ( */}
        <div className="flex w-full gap-2">
          <DatePicker value={deadline} onChange={setDeadline}>
            <Button
              type="button"
              icon={CalendarIcon}
              text={getDeadlineLabel()}
              textClassName="text-gray-300!"
              style={deadline ? { backgroundColor: COLORS.BLUE_50 } : undefined}
            />
          </DatePicker>

          <PrioritySelector
            value={priority}
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
          </PrioritySelector>

          <TagSelector value={selectedTags} onChange={onSelectTag}>
            <Button
              type="button"
              className="flex-1 min-w-0 overflow-hidden"
              textClassName="truncate text-gray-300!"
              icon={displayTag !== t("toDo.tag.none") ? undefined : TagIcon}
              text={displayTag}
              style={{ backgroundColor: firstTag?.color }}
            />
          </TagSelector>
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
