import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Task } from "@/types/toDo";
import { Typography } from "@atoms/Typography";
import { Button } from "@atoms/button/Button";
import { DatePicker } from "@atoms/DatePicker";
import { Dropdown } from "@atoms/Dropdown";
import { ConfirmDialog } from "@atoms/ConfirmDialog";
import { COLORS } from "@constants/colors";
import { OtherTaskActions, TaskPriorityType } from "@constants/common";
import { getPriorityConfig, shortDateFormatMap } from "@constants/toDoConfig";
import { useTodoStore } from "@stores/todoStore";
import CalendarIcon from "@icons/Calendar";
import FlagIcon from "@icons/Flag";
import { useTranslation } from "react-i18next";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Checkbox } from "@atoms/Checkbox";
import { useTodo } from "@hooks/useToDo";
import { getDeadlineColor } from "@utils/dateUtils";
import DeleteIcon from "@icons/Delete";
import { useConfetti } from "@organisms/toDo/ToDo";
import MoreIcon from "@icons/More";
import { SubtaskSection } from "./SubtaskSection";
import { TagDisplay } from "@molecules/toDo/TagDisplay";
import { PrioritySelector } from "@molecules/toDo/PrioritySelector";
import DuplicateIcon from "@icons/Duplicate";

const localeMap: Record<string, Locale> = { vi, en: enUS };
interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
  const { t, i18n } = useTranslation();
  const { updateTask, deleteTask, duplicateTask, toggleTask, moveTaskToList } =
    useTodoStore();
  const { searchResults, selectedList } = useTodo();
  const priorityConfig = getPriorityConfig();
  const fireConfetti = useConfetti();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriorityType>(
    task.priority ?? TaskPriorityType.NONE,
  );
  const [deadline, setDeadline] = useState<number | undefined>(task.deadline);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleToggle = (e: React.MouseEvent) => {
    if (!task.isCompleted) {
      fireConfetti?.(e.clientX, e.clientY);
    }
    toggleTask(task.id);
  };

  const handleDuplicate = () => {
    duplicateTask(task.id);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
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

  const onAssignTaskToList = (taskId: string, newListId: string) => {
    moveTaskToList(taskId, newListId);
    onClose();
  };

  const listsData = useMemo(() => {
    return searchResults.map((item) => {
      return {
        value: item.id,
        label: item.title,
      };
    });
  }, [searchResults]);

  const deadlineDate = useMemo(
    () => (task.deadline ? new Date(task.deadline) : undefined),
    [task.deadline],
  );

  const otherActionsData = [
    {
      label: (
        <div className="flex items-center gap-2">
          <DuplicateIcon />
          <Typography className="text-white">
            {t("toDo.action.duplicate")}
          </Typography>
        </div>
      ),
      value: OtherTaskActions.DUPLICATE,
      onClick: handleDuplicate,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <DeleteIcon color={COLORS.ERROR_400} />
          <Typography className="text-error-400!">
            {t("toDo.action.delete")}
          </Typography>
        </div>
      ),
      value: OtherTaskActions.DELETE,
      onClick: handleDelete,
    },
  ];

  return (
    <div className="flex flex-col gap-3 min-w-72 max-w-100">
      <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-2">
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
              isGhost
              textStyle={{
                color: `${deadline ? getDeadlineColor(deadlineDate) : COLORS.WHITE} !important`,
              }}
            />
          </DatePicker>

          <div className="h-6 w-px bg-white/20" />

          <PrioritySelector value={priority} onChange={handlePriorityChange}>
            <Button
              type="button"
              icon={FlagIcon}
              iconColor={priorityConfig[priority].color}
              className="hover:bg-white/40! bg-transparent!"
              textClassName="text-gray-300!"
              style={{ backgroundColor: priorityConfig[priority].bgColor }}
            />
          </PrioritySelector>
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

      <TagDisplay task={task} />

      <textarea
        ref={descriptionRef}
        value={description}
        rows={1}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder={t("toDo.detail.addDescription")}
        className="w-full text-white text-sz-default max-h-40 font-light placeholder:text-white/50 outline-none resize-none overflow-y-auto"
      />

      <SubtaskSection taskId={task.id} subtasks={task.subtasks || []} />

      {/* Footer */}
      <div className="flex border-t items-center justify-between border-white/20 pt-3 mt-1">
        <Dropdown
          value={task.listId}
          onChange={(listId: string) => onAssignTaskToList(task.id, listId)}
          menuClassName="max-w-80"
          header={t("toDo.detail.moveTo")}
          data={listsData}
        >
          <Button type="button" text={selectedList?.title} isGhost />
        </Dropdown>

        <Dropdown data={otherActionsData}>
          <Button
            type="button"
            icon={MoreIcon}
            iconColor={COLORS.WHITE}
            className="bg-transparent!"
          />
        </Dropdown>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("toDo.detail.deleteConfirm.title")}
        message={t("toDo.detail.deleteConfirm.message")}
        confirmText={t("toDo.detail.deleteConfirm.confirm")}
        cancelText={t("toDo.detail.deleteConfirm.cancel")}
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </div>
  );
};
