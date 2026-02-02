import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Task } from "@/types/toDo";
import { Typography } from "@atoms/Typography";
import { Button } from "@atoms/button/Button";
import { DatePicker } from "@atoms/DatePicker";
import { Dropdown } from "@atoms/Dropdown";
import { COLORS } from "@constants/colors";
import { TaskPriorityType, TypoVariants } from "@constants/common";
import { getPriorityConfig, shortDateFormatMap } from "@constants/toDoConfig";
import { useTodoStore } from "@stores/todoStore";
import CalendarIcon from "@icons/Calendar";
import FlagIcon from "@icons/Flag";
import MinusIcon from "@icons/Minus";
import { useTranslation } from "react-i18next";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Checkbox } from "@atoms/Checkbox";
import PlusIcon from "@icons/Plus";
import { useTodo } from "@hooks/useToDo";
import RefreshIcon from "@icons/Refresh";
import TagIcon from "@icons/Tag";
import { getDeadlineColor } from "@utils/dateUtils";

const localeMap: Record<string, Locale> = { vi, en: enUS };
const CREATE_TAG_VALUE = "createTag";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
  const { t, i18n } = useTranslation();
  const { updateTask, deleteTask, toggleTask } = useTodoStore();
  const {
    getDisplayTags,
    searchTagsResults,
    tagSearchTerm,
    setTagSearchTerm,
    addTag,
  } = useTodo();
  const priorityConfig = getPriorityConfig();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriorityType>(
    task.priority ?? TaskPriorityType.NONE,
  );
  const [deadline, setDeadline] = useState<number | undefined>(task.deadline);
  const [tags, setTags] = useState<string[]>(task.tags || []);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    const initTask = () => {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority ?? TaskPriorityType.NONE);
      setDeadline(task.deadline);
    };

    initTask();
  }, [task]);

  useEffect(() => {
    autoResize(titleRef.current);
  }, [title, autoResize]);

  useEffect(() => {
    autoResize(descriptionRef.current);
  }, [description, autoResize]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || "")) {
      updateTask(task.id, { description: description || undefined });
    }
  };

  const handlePriorityChange = (value: string) => {
    const newPriority = value as TaskPriorityType;
    setPriority(newPriority);
    updateTask(task.id, { priority: newPriority });
  };

  const handleDeadlineChange = (value: number | undefined) => {
    setDeadline(value);
    updateTask(task.id, { deadline: value });
  };

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

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

  const onSelectTag = (tagId: string) => {
    if (!tagId) return;
    if (tagId === CREATE_TAG_VALUE) {
      addTag(tagSearchTerm, COLORS.BLUE_50);
    } else {
      let newTags: string[] = [];
      if (tags.includes(tagId)) {
        newTags = tags.filter((tag) => tag !== tagId);
      } else {
        newTags = [...tags, tagId];
      }

      setTags(newTags);
      updateTask(task.id, { tags: newTags });
    }
  };

  const priorityData = [
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.ERROR_400} size={16} />
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
          <FlagIcon color={COLORS.WARNING_400} size={16} />
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
          <FlagIcon color={COLORS.BLUE_400} size={16} />
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
          <FlagIcon size={16} />
          <Typography className="text-white">
            {t("toDo.priority.none")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.NONE,
    },
  ];

  const tagsData = useMemo(() => {
    return searchTagsResults.length > 0
      ? searchTagsResults.map((item) => {
          return {
            value: item.id,
            label: (
              <div
                className={`rounded-full border px-2 ${tags.includes(item.id) ? "border-transparent" : "border-white"}`}
              >
                <Typography
                  className={`${tags.includes(item.id) ? "text-gray-300!" : "text-text-white"}`}
                >
                  #{item.title}
                </Typography>
              </div>
            ),
            color: item.color,
          };
        })
      : [
          {
            label: (
              <div className="w-full flex items-center gap-1">
                <PlusIcon />
                <Typography className="truncate flex-1">
                  {t("toDo.tag.createNew", { tagName: tagSearchTerm })}
                </Typography>
              </div>
            ),
            value: CREATE_TAG_VALUE,
          },
        ];
  }, [searchTagsResults, t, tagSearchTerm, tags]);

  const deadlineDate = useMemo(
    () => (task.deadline ? new Date(task.deadline) : undefined),
    [task.deadline],
  );

  return (
    <div className="flex flex-col gap-3 min-w-72 max-w-100">
      <div className="flex items-center justify-between gap-3">
        <Checkbox
          checked={task.isCompleted}
          borderColor={priorityConfig[priority].color}
          onClick={handleToggle}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker value={deadline} onChange={handleDeadlineChange}>
            <Button
              type="button"
              icon={CalendarIcon}
              iconColor={
                deadline ? getDeadlineColor(deadlineDate) : COLORS.WHITE
              }
              text={getDeadlineLabel()}
              className="hover:bg-white/40! bg-transparent!"
              textStyle={{
                color: deadline ? getDeadlineColor(deadlineDate) : COLORS.WHITE,
              }}
            />
          </DatePicker>

          <div className="h-6 w-px bg-white/20" />

          <Dropdown
            data={priorityData}
            value={priority}
            header={t("toDo.priority.title")}
            onChange={handlePriorityChange}
          >
            <Button
              type="button"
              icon={FlagIcon}
              iconColor={priorityConfig[priority].color}
              className="hover:bg-white/40! bg-transparent!"
              textClassName="text-gray-300!"
              style={{ backgroundColor: priorityConfig[priority].bgColor }}
            />
          </Dropdown>
        </div>
      </div>

      <textarea
        ref={titleRef}
        value={title}
        rows={1}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder={t("toDo.detail.addTitle")}
        className={`w-full text-white text-sz-large max-h-40 font-medium placeholder:text-white/50 outline-none resize-none overflow-y-auto`}
      />

      <textarea
        ref={descriptionRef}
        value={description}
        rows={1}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder={t("toDo.detail.addDescription")}
        className="w-full text-white text-sz-default max-h-40 font-light placeholder:text-white/50 outline-none resize-none overflow-y-auto"
      />

      <div className="flex gap-2 flex-wrap">
        <Dropdown
          data={tagsData}
          value={tags}
          multipleSelect
          isCompact
          menuClassName="max-w-80"
          menuItemClassName="p-0!"
          onChange={onSelectTag}
          onOpenChange={() => setTagSearchTerm("")}
          header={
            <div className="w-full flex gap-2 items-center mb-2 pb-2 border-b border-white/20">
              <RefreshIcon size={16} />
              <input
                value={tagSearchTerm}
                placeholder={t("toDo.tag.searchPlaceholder")}
                className="w-full outline-none text-white font-light text-sz-default"
                onChange={(e) => setTagSearchTerm(e.target.value)}
              />
            </div>
          }
        >
          <Button
            className="p-0! bg-transparent!"
            iconColor={COLORS.WHITE}
            icon={TagIcon}
          />
        </Dropdown>

        {getDisplayTags(tags).map((item) => {
          return (
            <div
              className="flex items-center gap-2 rounded-full pl-2 pr-0.5"
              style={{ backgroundColor: item.color }}
            >
              <Typography
                variant={TypoVariants.DESCRIPTION}
                className="text-gray-300!"
              >
                #{item.title}
              </Typography>

              <Button
                className="p-0! bg-transparent!"
                icon={MinusIcon}
                iconColor={COLORS.GRAY_300}
                onClick={() => onSelectTag(item.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Delete Button */}
      <div className="border-t border-white/20 pt-3 mt-1">
        <Button
          type="button"
          icon={MinusIcon}
          iconColor={COLORS.ERROR_400}
          text={t("toDo.detail.delete")}
          textClassName="text-red-400!"
          className="bg-red-500/10!"
          onClick={handleDelete}
        />
      </div>
    </div>
  );
};
