import { Task } from "@/types/toDo";
import { TaskSortBy, TaskPriorityType } from "@constants/common";

const PRIORITY_ORDER = {
  [TaskPriorityType.HIGH]: 0,
  [TaskPriorityType.MEDIUM]: 1,
  [TaskPriorityType.LOW]: 2,
  [TaskPriorityType.NONE]: 3,
};

/**
 * Sort tasks based on the specified sort criteria
 * @param tasks - Array of tasks to sort
 * @param sortBy - Sort criteria (DATE, DUE_DATE, PRIORITY, TITLE, MANUAL)
 * @returns Sorted array of tasks
 */
export function sortTasks(tasks: Task[], sortBy: TaskSortBy): Task[] {
  if (!tasks.length) return [];

  const result = [...tasks];

  switch (sortBy) {
    case TaskSortBy.DATE:
      // Sort by createdAt (newest first, deterministic, no order tiebreaker)
      return result.sort((a, b) => b.createdAt - a.createdAt);

    case TaskSortBy.DUE_DATE:
      // Tasks with deadline first (sorted by deadline), then tasks without deadline
      // Use order as tiebreaker within same deadline status
      return result.sort((a, b) => {
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && b.deadline) {
          const deadlineDiff = a.deadline - b.deadline;
          return deadlineDiff !== 0 ? deadlineDiff : a.order - b.order;
        }
        // Both no deadline, use order
        return a.order - b.order;
      });

    case TaskSortBy.PRIORITY:
      // Sort by priority (High→Medium→Low→None), use order as tiebreaker
      return result.sort((a, b) => {
        const priorityDiff =
          PRIORITY_ORDER[a.priority || TaskPriorityType.NONE] -
          PRIORITY_ORDER[b.priority || TaskPriorityType.NONE];
        return priorityDiff !== 0 ? priorityDiff : a.order - b.order;
      });

    case TaskSortBy.TITLE:
      // Sort alphabetically (deterministic, no order tiebreaker)
      return result.sort((a, b) => a.title.localeCompare(b.title));

    case TaskSortBy.MANUAL:
      // Sort purely by order field
      return result.sort((a, b) => a.order - b.order);

    default:
      return result;
  }
}
