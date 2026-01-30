import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/toDo";
import { TaskItem } from "./TaskItem";

interface SortableTaskItemProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  formatDeadline: (deadline: number) => string;
  groupId: string;
  disableSortAnimation?: boolean;
}

export const SortableTaskItem = ({
  task,
  isOpen,
  onOpenChange,
  onToggle,
  formatDeadline,
  groupId,
  disableSortAnimation = false,
}: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: task.id,
      data: {
        type: "task",
        task,
        groupId,
      },
    });

  const style = {
    transform: disableSortAnimation
      ? undefined
      : CSS.Transform.toString(transform),
    transition: undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="rounded">
      <TaskItem
        task={task}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onToggle={onToggle}
        formatDeadline={formatDeadline}
        showDragHandle={true}
        dragHandleProps={listeners}
      />
    </div>
  );
};
