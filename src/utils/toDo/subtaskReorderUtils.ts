import { Subtask } from "@/types/toDo";

/**
 * Calculate the new order value for a subtask being inserted at a specific index
 * Uses fractional ordering to insert between existing subtasks
 *
 * @param subtasks - All subtasks in order (excluding the dragged subtask)
 * @param targetIndex - Index where the subtask should be inserted
 * @returns The calculated order value
 */
export function calculateNewSubtaskOrder(
  subtasks: Subtask[],
  targetIndex: number,
): number {
  // Empty list - use order 0
  if (subtasks.length === 0) {
    return 0;
  }

  // Insert at beginning - subtract 1 from first subtask
  if (targetIndex === 0) {
    return subtasks[0].order - 1;
  }

  // Insert at end - add 1 to last subtask
  if (targetIndex >= subtasks.length) {
    return subtasks[subtasks.length - 1].order + 1;
  }

  // Insert in middle - average of surrounding subtasks (fractional ordering)
  const prevOrder = subtasks[targetIndex - 1].order;
  const nextOrder = subtasks[targetIndex].order;
  return (prevOrder + nextOrder) / 2;
}
