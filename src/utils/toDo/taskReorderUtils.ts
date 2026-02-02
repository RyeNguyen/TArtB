import { Task, TaskPropertyUpdates } from "@/types/toDo";
import { TaskPriorityType } from "@constants/common";

/**
 * Calculate the new order value for a task being inserted at a specific index
 * Uses fractional ordering to insert between existing tasks
 *
 * @param targetTasks - Tasks in the target group (excluding the dragged task)
 * @param targetIndex - Index where the task should be inserted
 * @param getTaskOrder - Optional function to get normalized order (used when switching to MANUAL)
 * @returns The calculated order value
 */
export function calculateNewTaskOrder(
  targetTasks: Task[],
  targetIndex: number,
  getTaskOrder?: (task: Task) => number,
): number {
  const orderFn = getTaskOrder || ((task: Task) => task.order);

  // Empty group - use order 0
  if (targetTasks.length === 0) {
    return 0;
  }

  // Insert at beginning - subtract 1 from first task
  if (targetIndex === 0) {
    return orderFn(targetTasks[0]) - 1;
  }

  // Insert at end - add 1 to last task
  if (targetIndex >= targetTasks.length) {
    return orderFn(targetTasks[targetTasks.length - 1]) + 1;
  }

  // Insert in middle - average of surrounding tasks
  const prevOrder = orderFn(targetTasks[targetIndex - 1]);
  const nextOrder = orderFn(targetTasks[targetIndex]);
  return (prevOrder + nextOrder) / 2;
}

/**
 * Determine property updates based on cross-group drag
 *
 * @param sourceGroupId - ID of the source group
 * @param targetGroupId - ID of the target group
 * @param targetGroupValue - Value of the target group (priority, deadline status, etc.)
 * @param currentTags - Current tags of the task (needed for tag group handling)
 * @returns Object with properties to update (priority, deadline, isCompleted, tags)
 */
export function getPropertyUpdatesForCrossGroupDrag(
  sourceGroupId: string,
  targetGroupId: string,
  targetGroupValue: string,
  currentTags?: string[],
): TaskPropertyUpdates {
  const updates: TaskPropertyUpdates = {};

  // Same group - no property changes
  if (sourceGroupId === targetGroupId) {
    return updates;
  }

  // Completed group changes
  if (targetGroupId === "completed") {
    updates.isCompleted = true;
  } else if (sourceGroupId === "completed") {
    updates.isCompleted = false;
  }

  // Priority group changes
  if (targetGroupId.startsWith("priority:")) {
    updates.priority = targetGroupValue as TaskPriorityType;
  }

  // Due date group changes - clear deadline when dropped in "No Date"
  if (targetGroupId === "dueDate:noDate") {
    updates.deadline = undefined;
  }

  // Tag group changes
  if (targetGroupId === "tag:none") {
    // Clear all tags when dropped in "No Tags" group
    updates.tags = [];
  } else if (targetGroupId.startsWith("tag:")) {
    // Add the target tag to existing tags (if not already present)
    const existingTags = currentTags || [];
    if (!existingTags.includes(targetGroupValue)) {
      updates.tags = [...existingTags, targetGroupValue];
    }
  }

  return updates;
}

/**
 * Create a function that returns normalized order for tasks
 * Used when switching from DATE/TITLE sort to MANUAL
 *
 * @param filteredTasks - All tasks in current visual order
 * @returns Function that returns normalized order (index) for a task
 */
export function createNormalizedOrderGetter(
  filteredTasks: Task[],
): (task: Task) => number {
  return (task: Task) => {
    const idx = filteredTasks.findIndex((t) => t.id === task.id);
    return idx >= 0 ? idx : task.order;
  };
}
