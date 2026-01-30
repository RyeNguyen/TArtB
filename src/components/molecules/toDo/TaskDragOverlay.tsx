import { Task } from "@/types/toDo";
import { Typography } from "@atoms/Typography";
import { TaskPriorityType } from "@constants/common";
import { PRIORITY_COLORS } from "@constants/toDoConfig";
import { Grip } from "../../icons/Grip";

interface TaskDragOverlayProps {
  task: Task;
}

export const TaskDragOverlay = ({ task }: TaskDragOverlayProps) => {
  const priorityColor = PRIORITY_COLORS[task.priority ?? TaskPriorityType.NONE].color;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md bg-gray-800/90 border border-white/20 shadow-xl cursor-grabbing">
      <Grip size={14} className="text-white/70" />
      <div
        className="w-4 h-4 rounded-full border-2 flex-shrink-0"
        style={{ borderColor: priorityColor }}
      />
      <Typography className="truncate max-w-[200px]">{task.title}</Typography>
    </div>
  );
};
