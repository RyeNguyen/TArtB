import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Subtask } from "@/types/toDo";
import { SortableSubtaskItem } from "../../molecules/toDo/SortableSubtaskItem";
import { calculateNewSubtaskOrder } from "@utils/toDo/subtaskReorderUtils";

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
  getDisplayTitle: (subtaskId: string, originalTitle: string) => string;
  onTitleChange: (subtaskId: string, title: string) => void;
  onTitleBlur: (subtaskId: string) => void;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  onReorder: (subtaskId: string, newOrder: number) => void;
  disabled?: boolean;
}

export const SubtaskList = ({
  subtasks,
  taskId,
  getDisplayTitle,
  onTitleChange,
  onTitleBlur,
  onToggle,
  onDelete,
  onReorder,
  disabled = false,
}: SubtaskListProps) => {
  // Configure sensors with distance activation to avoid conflicts with clicks and input focus
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Custom collision detection (similar to tasks)
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);

    // Prefer pointer collisions
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Fallback to rect intersection
    return rectIntersection(args);
  }, []);

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // Could add visual feedback here if needed
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const overIndex = subtasks.findIndex((s) => s.id === overId);

      if (overIndex === -1) return;

      // Filter out the active item (same as task reordering)
      const subtasksWithoutActive = subtasks.filter((s) => s.id !== activeId);

      // Calculate new order based on over index
      const newOrder = calculateNewSubtaskOrder(
        subtasksWithoutActive,
        overIndex,
      );

      // Call the reorder handler
      onReorder(activeId, newOrder);
    },
    [subtasks, onReorder],
  );

  const handleDragCancel = useCallback(() => {
    // Could add cleanup here if needed
  }, []);

  const subtaskIds = subtasks.map((s) => s.id);

  if (disabled) {
    // Render without drag and drop when disabled
    return (
      <div className="flex flex-col gap-1 opacity-50">
        {subtasks.map((subtask) => (
          <SortableSubtaskItem
            key={subtask.id}
            subtask={subtask}
            taskId={taskId}
            displayTitle={getDisplayTitle(subtask.id, subtask.title)}
            onTitleChange={onTitleChange}
            onTitleBlur={onTitleBlur}
            onToggle={onToggle}
            onDelete={onDelete}
            disabled={true}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={subtaskIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {subtasks.map((subtask) => (
            <SortableSubtaskItem
              key={subtask.id}
              subtask={subtask}
              taskId={taskId}
              displayTitle={getDisplayTitle(subtask.id, subtask.title)}
              onTitleChange={onTitleChange}
              onTitleBlur={onTitleBlur}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null} />
    </DndContext>
  );
};
