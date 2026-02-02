import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types/toDo";
import { useTodo, TaskGroup } from "@hooks/useToDo";
import { isToday, isTomorrow, format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { SortableTaskItem } from "./SortableTaskItem";
import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import { shortDateFormatMap } from "@constants/toDoConfig";

const localeMap: Record<string, Locale> = { vi, en: enUS };

const DroppableGroup = ({
  group,
  children,
  isActiveGroup,
  isOverGroup,
}: {
  group: TaskGroup;
  children: React.ReactNode;
  isActiveGroup: boolean;
  isOverGroup: boolean;
}) => {
  const { setNodeRef } = useDroppable({
    id: `group-${group.id}`,
    data: {
      type: "group",
      groupId: group.id,
      accepts: group.isDroppable,
    },
  });

  const taskIds = group.tasks.map((t) => t.id);

  // Show highlight when dragging over this group from another group
  const showDropHighlight = isOverGroup && group.isDroppable && !isActiveGroup;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-md transition-colors ${
        showDropHighlight ? "bg-white/10" : ""
      }`}
    >
      {group.label && (
        <Typography
          variant={TypoVariants.SUBTITLE}
          className="text-white/50 uppercase mt-2 mb-1"
        >
          {group.label}
        </Typography>
      )}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
};

export const ToDoList = () => {
  const { t, i18n } = useTranslation();
  const { groupedTasks, handleToggleTask, handleReorderTask } = useTodo();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [_, setActiveTask] = useState<Task | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);

  // Configure sensors with distance activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Create a map of task ID to group ID for quick lookup
  const taskToGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    groupedTasks.forEach((group) => {
      group.tasks.forEach((task) => {
        map.set(task.id, group.id);
      });
    });
    return map;
  }, [groupedTasks]);

  // Custom collision detection that prefers items in the same group
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);

    // Find group collisions
    const groupCollision = pointerCollisions.find((c) =>
      String(c.id).startsWith("group-"),
    );

    // Find task collisions
    const taskCollisions = pointerCollisions.filter(
      (c) => !String(c.id).startsWith("group-"),
    );

    // If have task collisions, prefer those
    if (taskCollisions.length > 0) {
      return taskCollisions;
    }

    // If over a group but not over a task, return the group
    if (groupCollision) {
      return [groupCollision];
    }

    // Fallback to rect intersection for edge cases
    return rectIntersection(args);
  }, []);

  const formatDeadline = (deadline: number): string => {
    const date = new Date(deadline);
    if (isToday(date)) return t("toDo.deadline.today");
    if (isTomorrow(date)) return t("toDo.deadline.tomorrow");
    const dateFormat =
      shortDateFormatMap[i18n.language] || shortDateFormatMap.en;
    return format(date, dateFormat, {
      locale: localeMap[i18n.language] || enUS,
    });
  };

  const handleOpenChange = (taskId: string, open: boolean) => {
    setOpenTaskId(open ? taskId : null);
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = active.data.current?.task as Task | undefined;
      const groupId = taskToGroupMap.get(active.id as string);

      if (task) {
        setActiveTask(task);
        setActiveGroupId(groupId || null);
        setOverGroupId(groupId || null);
      }
    },
    [taskToGroupMap],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;

      if (!over) {
        setOverGroupId(activeGroupId);
        return;
      }

      let newOverGroupId: string | null = null;

      if (String(over.id).startsWith("group-")) {
        newOverGroupId = String(over.id).replace("group-", "");
      } else {
        newOverGroupId = taskToGroupMap.get(over.id as string) || null;
      }

      if (newOverGroupId !== overGroupId) {
        setOverGroupId(newOverGroupId);
      }
    },
    [activeGroupId, overGroupId, taskToGroupMap],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      const currentActiveGroupId = activeGroupId;
      setActiveTask(null);
      setActiveGroupId(null);
      setOverGroupId(null);

      if (!over || !currentActiveGroupId) return;

      const activeId = active.id as string;

      let targetGroupId: string;
      let targetIndex: number;

      if (String(over.id).startsWith("group-")) {
        targetGroupId = String(over.id).replace("group-", "");
        const group = groupedTasks.find((g) => g.id === targetGroupId);
        targetIndex = group?.tasks.length || 0;
      } else {
        targetGroupId =
          taskToGroupMap.get(over.id as string) || currentActiveGroupId;
        const group = groupedTasks.find((g) => g.id === targetGroupId);
        if (!group) return;

        const overIndex = group.tasks.findIndex((t) => t.id === over.id);
        if (overIndex === -1) return;

        const activeIndex = group.tasks.findIndex((t) => t.id === activeId);

        if (currentActiveGroupId === targetGroupId && activeIndex !== -1) {
          targetIndex = overIndex;
        } else {
          targetIndex = overIndex;
        }
      }

      const targetGroup = groupedTasks.find((g) => g.id === targetGroupId);
      if (!targetGroup?.isDroppable && currentActiveGroupId !== targetGroupId) {
        return;
      }

      if (activeId === over.id && currentActiveGroupId === targetGroupId) {
        return;
      }

      await handleReorderTask(
        activeId,
        targetIndex,
        targetGroupId,
        currentActiveGroupId,
      );
    },
    [activeGroupId, groupedTasks, handleReorderTask, taskToGroupMap],
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveGroupId(null);
    setOverGroupId(null);
  }, []);

  const isCrossGroupDrag =
    activeGroupId !== null &&
    overGroupId !== null &&
    activeGroupId !== overGroupId;

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        {groupedTasks.map((group) => (
          <DroppableGroup
            key={group.id}
            group={group}
            isActiveGroup={activeGroupId === group.id}
            isOverGroup={overGroupId === group.id}
          >
            {group.tasks.map((task: Task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                groupId={group.id}
                isOpen={openTaskId === task.id}
                onOpenChange={(open) => handleOpenChange(task.id, open)}
                onToggle={handleToggleTask}
                formatDeadline={formatDeadline}
                disableSortAnimation={isCrossGroupDrag}
              />
            ))}
          </DroppableGroup>
        ))}

        <DragOverlay dropAnimation={null} />
      </DndContext>
    </div>
  );
};
