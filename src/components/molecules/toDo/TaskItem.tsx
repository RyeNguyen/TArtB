import React, { useMemo } from "react";
import { Task } from "@/types/toDo";
import { Typography } from "@atoms/Typography";
import { Popover, PopoverTrigger, PopoverContent } from "@atoms/Popover";
import { TaskPriorityType } from "@constants/common";
import { PRIORITY_COLORS } from "@constants/toDoConfig";
import { CompactTaskDetail } from "../../organisms/toDo/compactMode/CompactTaskDetail";
import { Checkbox } from "@atoms/Checkbox";
import { getDeadlineColor } from "@utils/dateUtils";
import DragListIcon from "@icons/DragList";

interface TaskItemProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  formatDeadline: (deadline: number) => string;
  showDragHandle?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isFocusMode?: boolean;
  onTaskClick?: (taskId: string) => void;
  isSelected?: boolean;
}

export const TaskItem = ({
  task,
  isOpen,
  onOpenChange,
  onToggle,
  formatDeadline,
  showDragHandle = false,
  dragHandleProps,
  isFocusMode = false,
  onTaskClick,
  isSelected = false,
}: TaskItemProps) => {
  const deadlineDate = useMemo(
    () => (task.deadline ? new Date(task.deadline) : undefined),
    [task.deadline],
  );

  const completedSubtasksAmount = task.subtasks
    ? task.subtasks.filter((s) => s.isCompleted).length
    : 0;
  const havingSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleTaskClick = () => {
    if (isFocusMode && onTaskClick) {
      onTaskClick(task.id);
    }
  };

  const taskContent = (
    <div
      className={`flex items-center justify-between gap-2 p-2 pr-2 rounded-2xl group hover:bg-white/20 ${
        isSelected ? "bg-white/20" : ""
      } ${isFocusMode ? "cursor-pointer" : ""}`}
      onClick={isFocusMode ? handleTaskClick : undefined}
    >
      {showDragHandle && (
        <div
          {...dragHandleProps}
          className="opacity-0 group-hover:opacity-50 hover:opacity-100! cursor-grab active:cursor-grabbing transition-opacity touch-none"
        >
          <DragListIcon />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex flex-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              checked={task.isCompleted}
              borderColor={
                PRIORITY_COLORS[task.priority ?? TaskPriorityType.NONE].color
              }
              onClick={(e) => onToggle(task.id, e)}
            />

            {isFocusMode ? (
              <Typography
                className={`truncate flex-1 ${task.isCompleted ? "line-through opacity-50" : ""}`}
              >
                {task.title}
              </Typography>
            ) : (
              <PopoverTrigger className="flex-1 min-w-0">
                <Typography
                  className={`truncate flex-1 ${task.isCompleted ? "line-through opacity-50" : ""}`}
                >
                  {task.title}
                </Typography>
              </PopoverTrigger>
            )}
          </div>

          {task.deadline && (
            <Typography style={{ color: getDeadlineColor(deadlineDate) }}>
              {formatDeadline(task.deadline)}
            </Typography>
          )}
        </div>

        {havingSubtasks && (
          <div className="flex items-center gap-1">
            {Array.from({ length: completedSubtasksAmount }, (_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full bg-primary-300`}
              />
            ))}
            {Array.from(
              {
                length: (task.subtasks?.length ?? 0) - completedSubtasksAmount,
              },
              (_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full bg-white/20`}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );

  // In focus mode, return task content without popover
  if (isFocusMode) {
    return taskContent;
  }

  // In compact mode, wrap with popover
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {taskContent}
      <PopoverContent className="p-3">
        <CompactTaskDetail task={task} onClose={() => onOpenChange(false)} />
      </PopoverContent>
    </Popover>
  );
};
