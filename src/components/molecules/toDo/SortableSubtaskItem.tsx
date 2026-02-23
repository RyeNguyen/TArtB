import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Subtask } from "@/types/toDo";
import { Checkbox } from "@atoms/Checkbox";
import DeleteIcon from "@icons/Delete";
import DragListIcon from "@icons/DragList";

interface SortableSubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  displayTitle: string;
  onTitleChange: (subtaskId: string, title: string) => void;
  onTitleBlur: (subtaskId: string) => void;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  disabled?: boolean;
}

export const SortableSubtaskItem = ({
  subtask,
  taskId,
  displayTitle,
  onTitleChange,
  onTitleBlur,
  onToggle,
  onDelete,
  disabled = false,
}: SortableSubtaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.id,
    data: {
      type: "subtask",
      subtask,
      taskId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-1.5 rounded-lg hover:bg-white/10 group transition-colors ${disabled ? 'pointer-events-none' : ''}`}
    >
      {!disabled && (
        <div
          {...listeners}
          className="opacity-0 group-hover:opacity-50 hover:opacity-100! cursor-grab active:cursor-grabbing transition-opacity"
          style={{ touchAction: "none" }}
        >
          <DragListIcon />
        </div>
      )}

      <Checkbox
        checked={subtask.isCompleted}
        onClick={() => !disabled && onToggle(subtask.id)}
      />

      <input
        type="text"
        value={displayTitle}
        onChange={(e) => !disabled && onTitleChange(subtask.id, e.target.value)}
        onBlur={() => !disabled && onTitleBlur(subtask.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        disabled={subtask.isCompleted || disabled}
        readOnly={disabled}
        className={`flex-1 text-sz-default font-light text-white outline-none disabled:opacity-50 bg-transparent ${
          subtask.isCompleted ? "line-through" : ""
        } ${isDragging ? "pointer-events-none" : ""} ${disabled ? 'ml-5.5' : ''}`}
      />

      {!disabled && (
        <button
          onClick={() => onDelete(subtask.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <DeleteIcon />
        </button>
      )}
    </div>
  );
};
