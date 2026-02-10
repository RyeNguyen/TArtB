import { useTodoStore } from "@stores/todoStore";
import { Typography } from "@atoms/Typography";
import { Checkbox } from "@atoms/Checkbox";
import { getPriorityConfig, shortDateFormatMap } from "@constants/toDoConfig";
import { useConfetti } from "@organisms/toDo/ToDo";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OtherTaskActions, TaskPriorityType } from "@constants/common";
import { DatePicker } from "@atoms/DatePicker";
import { Button } from "@atoms/button/Button";
import CalendarIcon from "@icons/Calendar";
import { getDeadlineColor } from "@utils/dateUtils";
import { COLORS } from "@constants/colors";
import { PrioritySelector } from "@molecules/toDo/PrioritySelector";
import FlagIcon from "@icons/Flag";
import { format, isToday, isTomorrow, Locale } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { SubtaskSection } from "@organisms/toDo/SubtaskSection";
import { Dropdown } from "@atoms/Dropdown";
import { useTodo } from "@hooks/useToDo";
import MoreIcon from "@icons/More";
import GroupIcon from "@icons/Group";
import DeleteIcon from "@icons/Delete";
import { ConfirmDialog } from "@atoms/ConfirmDialog";

const localeMap: Record<string, Locale> = { vi, en: enUS };

export const FocusTaskDetail = () => {
  const { t, i18n } = useTranslation();
  const {
    selectedTaskId,
    tasks,
    updateTask,
    toggleTask,
    duplicateTask,
    moveTaskToList,
    deleteTask,
  } = useTodoStore();
  const { searchResults, selectedList } = useTodo();

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  const priorityConfig = getPriorityConfig();
  const fireConfetti = useConfetti();

  const [title, setTitle] = useState(selectedTask?.title || "");
  const [description, setDescription] = useState(
    selectedTask?.description || "",
  );
  const [priority, setPriority] = useState<TaskPriorityType>(
    selectedTask?.priority ?? TaskPriorityType.NONE,
  );
  const [deadline, setDeadline] = useState<number | undefined>(
    selectedTask?.deadline,
  );
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
      setTitle(selectedTask?.title || "");
      setDescription(selectedTask?.description || "");
      setPriority(selectedTask?.priority ?? TaskPriorityType.NONE);
      setDeadline(selectedTask?.deadline);
    };

    initTask();
  }, [selectedTask]);

  useEffect(() => {
    autoResize(titleRef.current);
  }, [title, autoResize]);

  useEffect(() => {
    autoResize(descriptionRef.current);
  }, [description, autoResize]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== selectedTask?.title) {
      updateTask(selectedTask?.id || "", { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (selectedTask?.description || "")) {
      updateTask(selectedTask?.id || "", {
        description: description || undefined,
      });
    }
  };

  const handlePriorityChange = (value: string) => {
    const newPriority = value as TaskPriorityType;
    setPriority(newPriority);
    updateTask(selectedTask?.id || "", { priority: newPriority });
  };

  const handleDeadlineChange = (value: number | undefined) => {
    setDeadline(value);
    updateTask(selectedTask?.id || "", { deadline: value });
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (!selectedTask?.isCompleted) {
      fireConfetti?.(e.clientX, e.clientY);
    }
    toggleTask(selectedTask?.id || "");
  };

  const handleDuplicate = () => {
    duplicateTask(selectedTask?.id || "");
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteTask(selectedTask?.id || "");
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
    () =>
      selectedTask?.deadline ? new Date(selectedTask.deadline) : undefined,
    [selectedTask],
  );

  const otherActionsData = [
    {
      label: (
        <div className="flex items-center gap-2">
          <GroupIcon />
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
    <div className="w-[40%] h-full flex flex-col pt-4 border-l border-white/20 overflow-hidden">
      {selectedTask ? (
        <>
          <div className="pl-4 flex items-center justify-between gap-3 border-b border-white/20 pb-4 shrink-0">
            <Checkbox
              checked={selectedTask.isCompleted}
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

              <PrioritySelector
                value={priority}
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
              </PrioritySelector>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="py-4 pl-4 flex flex-col gap-4">
              <textarea
                ref={titleRef}
                value={title}
                rows={1}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder={t("toDo.detail.addTitle")}
                className={`w-full text-white text-sz-large font-medium placeholder:text-white/50 outline-none resize-none overflow-y-hidden`}
              />

              {/* <TagDisplay task={task} /> */}

              <textarea
                ref={descriptionRef}
                value={description}
                rows={1}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder={t("toDo.detail.addDescription")}
                className="w-full text-white text-sz-default font-light placeholder:text-white/50 outline-none resize-none overflow-y-hidden"
              />
              <SubtaskSection
                taskId={selectedTaskId || ""}
                subtasks={selectedTask.subtasks || []}
              />
            </div>
          </div>

          <div className="pl-4 pt-4 flex items-center justify-between border-t border-white/20 shrink-0">
            <Dropdown
              value={selectedTask?.listId}
              onChange={(listId: string) =>
                onAssignTaskToList(selectedTask?.id || "", listId)
              }
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
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Typography className="text-white/50 text-center">
            Select a task to view details
          </Typography>
        </div>
      )}
    </div>
  );
};
