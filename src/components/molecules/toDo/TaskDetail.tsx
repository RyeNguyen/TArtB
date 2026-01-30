import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/toDo";
import { Typography } from "@atoms/Typography";
import { Button } from "@atoms/button/Button";
import { DatePicker } from "@atoms/DatePicker";
import { Dropdown } from "@atoms/Dropdown";
import { COLORS } from "@constants/colors";
import { TaskPriorityType } from "@constants/common";
import { getPriorityConfig } from "@constants/toDoConfig";
import { useTodoStore } from "@stores/todoStore";
import CalendarIcon from "@icons/Calendar";
import FlagIcon from "@icons/Flag";
import MinusIcon from "@icons/Minus";
import { useTranslation } from "react-i18next";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Checkbox } from "@atoms/Checkbox";

const localeMap: Record<string, Locale> = { vi, en: enUS };
const shortDateFormatMap: Record<string, string> = {
  vi: "d MMM",
  en: "MMM d",
};

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
  const { t, i18n } = useTranslation();
  const { updateTask, deleteTask, toggleTask } = useTodoStore();
  const priorityConfig = getPriorityConfig();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriorityType>(
    task.priority ?? TaskPriorityType.NONE,
  );
  const [deadline, setDeadline] = useState<number | undefined>(task.deadline);

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

  // Auto-resize textareas when content changes
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
    const dateFormat = shortDateFormatMap[i18n.language] || shortDateFormatMap.en;
    return format(date, dateFormat, { locale: localeMap[i18n.language] || enUS });
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

  return (
    <div className="flex flex-col gap-3 min-w-72">
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
              text={getDeadlineLabel()}
              textClassName="text-gray-300!"
              style={deadline ? { backgroundColor: COLORS.BLUE_50 } : undefined}
            />
          </DatePicker>

          <Dropdown
            data={priorityData}
            value={priority}
            header={t("toDo.priority.title")}
            onChange={handlePriorityChange}
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
        </div>
      </div>

      <textarea
        ref={titleRef}
        value={title}
        rows={1}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder={t("toDo.detail.addTitle")}
        className={`w-full text-white text-[20px] max-h-40 font-medium placeholder:text-white/50 outline-none resize-none overflow-y-auto`}
      />

      <textarea
        ref={descriptionRef}
        value={description}
        rows={1}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder={t("toDo.detail.addDescription")}
        className="w-full text-white text-[18px] max-h-40 font-light placeholder:text-white/50 outline-none resize-none overflow-y-auto"
      />

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
