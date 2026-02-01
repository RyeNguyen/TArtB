import { Task, TaskGroup, TranslateFunction } from "@/types/toDo";
import { TaskGroupBy, TaskPriorityType } from "@constants/common";
import { getPriorityConfig } from "@constants/toDoConfig";

const DAY_MS = 86400000;

/**
 * Group tasks by priority (High, Medium, Low, None)
 */
function groupByPriority(tasks: Task[], _t: TranslateFunction): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const priorityConfig = getPriorityConfig();
  const order = [
    TaskPriorityType.HIGH,
    TaskPriorityType.MEDIUM,
    TaskPriorityType.LOW,
    TaskPriorityType.NONE,
  ];

  for (const p of order) {
    const matched = tasks.filter(
      (t) => (t.priority || TaskPriorityType.NONE) === p,
    );
    if (matched.length > 0) {
      groups.push({
        id: `priority:${p}`,
        label: priorityConfig[p].label,
        tasks: matched,
        groupValue: p,
        isDroppable: true,
      });
    }
  }

  return groups;
}

/**
 * Group tasks by creation date (Today, Tomorrow, Earlier, Later)
 */
function groupByDate(tasks: Task[], t: TranslateFunction): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  const tomorrowTs = todayTs + DAY_MS;

  const buckets: Record<string, { key: string; tasks: Task[] }> = {};

  for (const task of tasks) {
    let key: string;
    let label: string;
    if (task.createdAt >= todayTs && task.createdAt < tomorrowTs) {
      key = "today";
      label = t("toDo.groupBy.today");
    } else if (
      task.createdAt >= tomorrowTs &&
      task.createdAt < tomorrowTs + DAY_MS
    ) {
      key = "tomorrow";
      label = t("toDo.groupBy.tomorrow");
    } else if (task.createdAt < todayTs) {
      key = "earlier";
      label = t("toDo.groupBy.earlier");
    } else {
      key = "later";
      label = t("toDo.groupBy.later");
    }
    if (!buckets[key]) {
      buckets[key] = { key: label, tasks: [] };
    }
    buckets[key].tasks.push(task);
  }

  for (const [key, { key: label, tasks }] of Object.entries(buckets)) {
    groups.push({
      id: `date:${key}`,
      label,
      tasks,
      groupValue: key,
      isDroppable: false, // Created date is immutable
    });
  }

  return groups;
}

/**
 * Group tasks by deadline status (Overdue, Upcoming, No Date)
 */
function groupByDueDate(tasks: Task[], t: TranslateFunction): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const overdue: Task[] = [];
  const upcoming: Task[] = [];
  const noDate: Task[] = [];

  for (const task of tasks) {
    if (!task.deadline) {
      noDate.push(task);
    } else if (task.deadline < todayTs) {
      overdue.push(task);
    } else {
      upcoming.push(task);
    }
  }

  if (overdue.length > 0) {
    groups.push({
      id: "dueDate:overdue",
      label: t("toDo.groupBy.overdue"),
      tasks: overdue,
      groupValue: "overdue",
      isDroppable: false, // Overdue is read-only (based on actual dates)
    });
  }
  if (upcoming.length > 0) {
    groups.push({
      id: "dueDate:upcoming",
      label: t("toDo.groupBy.upcoming"),
      tasks: upcoming,
      groupValue: "upcoming",
      isDroppable: false, // Upcoming is read-only (based on actual dates)
    });
  }
  if (noDate.length > 0) {
    groups.push({
      id: "dueDate:noDate",
      label: t("toDo.groupBy.noDate"),
      tasks: noDate,
      groupValue: "noDate",
      isDroppable: true, // Can drop to clear deadline
    });
  }

  return groups;
}

/**
 * Create the completed tasks group
 */
function createCompletedGroup(tasks: Task[], t: TranslateFunction): TaskGroup {
  return {
    id: "completed",
    label: t("toDo.completed"),
    tasks,
    groupValue: "completed",
    isDroppable: true, // Can drop to mark as completed
  };
}

/**
 * Group tasks based on the specified grouping criteria
 * @param tasks - Array of tasks to group (should be sorted before grouping)
 * @param groupBy - Grouping criteria (PRIORITY, DATE, DUE_DATE, NONE)
 * @param t - Translation function for labels
 * @returns Array of task groups
 */
export function groupTasks(
  tasks: Task[],
  groupBy: TaskGroupBy,
  t: TranslateFunction,
): TaskGroup[] {
  if (!tasks.length) return [];

  const incomplete = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

  const groups: TaskGroup[] = [];

  switch (groupBy) {
    case TaskGroupBy.PRIORITY:
      groups.push(...groupByPriority(incomplete, t));
      break;

    case TaskGroupBy.DATE:
      groups.push(...groupByDate(incomplete, t));
      break;

    case TaskGroupBy.DUE_DATE:
      groups.push(...groupByDueDate(incomplete, t));
      break;

    case TaskGroupBy.NONE:
    default:
      // No grouping for incomplete tasks
      if (incomplete.length > 0) {
        groups.push({
          id: "none",
          label: "",
          tasks: incomplete,
          groupValue: "",
          isDroppable: true,
        });
      }
      break;
  }

  // Always append completed group if there are completed tasks
  if (completed.length > 0) {
    groups.push(createCompletedGroup(completed, t));
  }

  return groups;
}
