import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@stores/todoStore";
import { useSettingsStore } from "@stores/settingsStore";
import {
  WidgetId,
  TaskSortBy,
  TaskPriorityType,
  TaskGroupBy,
} from "@constants/common";
import { Task, TaskList } from "@/types/toDo";
import { getPriorityConfig } from "@constants/toDoConfig";

export interface TaskGroup {
  id: string;
  label: string;
  tasks: Task[];
  groupValue: string;
  isDroppable: boolean;
}

export const useTodo = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const {
    lists,
    tasks,
    isLoaded,
    isSyncing,
    hasInitializedDefaultList,
    loadData,
    searchList,
    addTask,
    addList,
    toggleTask,
    getTasksByList,
    reorderTaskInGroup,
    normalizeTaskOrders,
  } = useTodoStore();

  const toDoSettings = settings.widgets[WidgetId.TODO];
  const selectedListId = toDoSettings.selectedListId;

  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [priority, setPriority] = useState<TaskPriorityType>(
    TaskPriorityType.NONE,
  );
  const [deadline, setDeadline] = useState<number | undefined>(undefined);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TaskList[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    if (!isLoaded) loadData();
  }, [isLoaded, loadData]);

  useEffect(() => {
    let cancelled = false;

    const debounceSearch = () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults(lists);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      searchList(debouncedSearchTerm).then((results) => {
        if (!cancelled) {
          setSearchResults(results);
          setIsSearching(false);
        }
      });
    };

    debounceSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, searchList, lists]);

  const handleUpdateSetting = useCallback(
    (key: string, value: any) => {
      updateSettings({
        widgets: {
          ...settings.widgets,
          [WidgetId.TODO]: { ...toDoSettings, [key]: value },
        },
      });
    },
    [settings.widgets, toDoSettings, updateSettings],
  );

  useEffect(() => {
    // Only create default list if:
    // - Data is loaded
    // - Not currently syncing (to avoid creating during real-time updates)
    // - Haven't already initialized a default list
    // - No lists exist
    console.log("[useToDo] Default list check:", {
      isLoaded,
      isSyncing,
      hasInitializedDefaultList,
      listsLength: lists.length
    });
    if (isLoaded && !isSyncing && !hasInitializedDefaultList && lists.length === 0) {
      console.log("[useToDo] Creating default list...");
      useTodoStore.setState({ hasInitializedDefaultList: true });
      addList(t("toDo.myDay")).then((newListId) => {
        handleUpdateSetting("selectedListId", newListId);
      });
    }
  }, [addList, handleUpdateSetting, isLoaded, isSyncing, hasInitializedDefaultList, lists.length, t]);

  // Determine if reordering within groups is allowed based on sort criteria
  // MANUAL, PRIORITY, DUE_DATE all support order-based reordering
  // DATE and TITLE are deterministic - dragging will auto-switch to MANUAL
  const allowsReorder = useMemo(() => {
    return (
      toDoSettings.sortBy === TaskSortBy.MANUAL ||
      toDoSettings.sortBy === TaskSortBy.PRIORITY ||
      toDoSettings.sortBy === TaskSortBy.DUE_DATE
    );
  }, [toDoSettings.sortBy]);

  const filteredTasks = useMemo(() => {
    if (!selectedListId) return [];
    let result = getTasksByList(selectedListId);

    if (toDoSettings.sortBy === TaskSortBy.DATE) {
      // Sort by createdAt (deterministic, no order tiebreaker)
      result = [...result].sort((a, b) => b.createdAt - a.createdAt);
    } else if (toDoSettings.sortBy === TaskSortBy.DUE_DATE) {
      // Tasks with deadline first (sorted by deadline), then tasks without deadline
      // Use order as tiebreaker within same deadline status
      result = [...result].sort((a, b) => {
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && b.deadline) {
          const deadlineDiff = a.deadline - b.deadline;
          return deadlineDiff !== 0 ? deadlineDiff : a.order - b.order;
        }
        // Both no deadline, use order
        return a.order - b.order;
      });
    } else if (toDoSettings.sortBy === TaskSortBy.PRIORITY) {
      const priorityOrder = {
        [TaskPriorityType.HIGH]: 0,
        [TaskPriorityType.MEDIUM]: 1,
        [TaskPriorityType.LOW]: 2,
        [TaskPriorityType.NONE]: 3,
      };
      // Use order as tiebreaker within same priority
      result = [...result].sort((a, b) => {
        const priorityDiff =
          priorityOrder[a.priority || TaskPriorityType.NONE] -
          priorityOrder[b.priority || TaskPriorityType.NONE];
        return priorityDiff !== 0 ? priorityDiff : a.order - b.order;
      });
    } else if (toDoSettings.sortBy === TaskSortBy.TITLE) {
      // Sort alphabetically (deterministic, no order tiebreaker)
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (toDoSettings.sortBy === TaskSortBy.MANUAL) {
      // Sort purely by order field
      result = [...result].sort((a, b) => a.order - b.order);
    }
    return result;
  }, [selectedListId, tasks, toDoSettings.sortBy, getTasksByList]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    const incomplete = filteredTasks.filter((t) => !t.isCompleted);
    const completed = filteredTasks.filter((t) => t.isCompleted);

    const groups: TaskGroup[] = [];

    if (toDoSettings.groupBy === TaskGroupBy.PRIORITY) {
      const priorityConfig = getPriorityConfig();
      const order = [
        TaskPriorityType.HIGH,
        TaskPriorityType.MEDIUM,
        TaskPriorityType.LOW,
        TaskPriorityType.NONE,
      ];
      for (const p of order) {
        const matched = incomplete.filter(
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
    } else if (toDoSettings.groupBy === TaskGroupBy.DATE) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = today.getTime();
      const tomorrowTs = todayTs + 86400000;

      const buckets: Record<string, { key: string; tasks: Task[] }> = {};
      for (const task of incomplete) {
        let key: string;
        let label: string;
        if (task.createdAt >= todayTs && task.createdAt < tomorrowTs) {
          key = "today";
          label = t("toDo.groupBy.today");
        } else if (
          task.createdAt >= tomorrowTs &&
          task.createdAt < tomorrowTs + 86400000
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
    } else if (toDoSettings.groupBy === TaskGroupBy.DUE_DATE) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = today.getTime();

      const overdue: Task[] = [];
      const upcoming: Task[] = [];
      const noDate: Task[] = [];

      for (const task of incomplete) {
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
    } else {
      // NONE or TAGS (later) — no grouping for incomplete
      if (incomplete.length > 0) {
        groups.push({
          id: "none",
          label: "",
          tasks: incomplete,
          groupValue: "",
          isDroppable: true,
        });
      }
    }

    if (completed.length > 0) {
      groups.push({
        id: "completed",
        label: t("toDo.completed"),
        tasks: completed,
        groupValue: "completed",
        isDroppable: true, // Can drop to mark as completed
      });
    }

    return groups;
  }, [filteredTasks, t, toDoSettings.groupBy]);

  // Get all task IDs in order for the flat list (needed for SortableContext)
  const taskIds = useMemo(() => {
    return groupedTasks.flatMap((g) => g.tasks.map((t) => t.id));
  }, [groupedTasks]);

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsInputFocused(false);
    }
  };

  const handleAddList = async () => {
    if (!searchTerm.trim()) return;

    await addList(searchTerm).then((newListId) => {
      handleUpdateSetting("selectedListId", newListId);
    });
    setSearchTerm("");
  };

  const handleSelectList = (listId: string) => {
    handleUpdateSetting("selectedListId", listId);
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedListId) return;

    await addTask(selectedListId, inputValue.trim(), { priority, deadline });
    setInputValue("");
    setPriority(TaskPriorityType.NONE);
    setDeadline(undefined);
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTask(taskId);
  };

  // Handle reordering after drag ends
  const handleReorderTask = useCallback(
    async (
      taskId: string,
      targetIndex: number,
      targetGroupId: string,
      sourceGroupId: string,
    ) => {
      // Always switch to MANUAL when dragging (unless already MANUAL)
      // This ensures the drag position is fully respected
      const switchingToManual = toDoSettings.sortBy !== TaskSortBy.MANUAL;

      if (switchingToManual) {
        // Normalize order fields to match current visual order (0, 1, 2, ...)
        const currentVisualOrder = filteredTasks.map((t) => t.id);
        await normalizeTaskOrders(currentVisualOrder);
        handleUpdateSetting("sortBy", TaskSortBy.MANUAL);
      }

      // Find the target group to get context
      const targetGroup = groupedTasks.find((g) => g.id === targetGroupId);
      const sourceGroup = groupedTasks.find((g) => g.id === sourceGroupId);

      if (!targetGroup || !sourceGroup) return;

      // Calculate the new order based on target index within the group
      // When switching to MANUAL, use indices since orders are now 0, 1, 2...
      const targetTasks = targetGroup.tasks.filter((t) => t.id !== taskId);
      let newOrder: number;

      if (switchingToManual) {
        // After normalization, orders are sequential indices
        // Find the task's current index in filteredTasks to get its normalized order
        const getTaskOrder = (task: Task) => {
          const idx = filteredTasks.findIndex((t) => t.id === task.id);
          return idx >= 0 ? idx : task.order;
        };

        if (targetTasks.length === 0) {
          newOrder = 0;
        } else if (targetIndex === 0) {
          newOrder = getTaskOrder(targetTasks[0]) - 1;
        } else if (targetIndex >= targetTasks.length) {
          newOrder = getTaskOrder(targetTasks[targetTasks.length - 1]) + 1;
        } else {
          const prevOrder = getTaskOrder(targetTasks[targetIndex - 1]);
          const nextOrder = getTaskOrder(targetTasks[targetIndex]);
          newOrder = (prevOrder + nextOrder) / 2;
        }
      } else {
        // Normal case - use existing order values
        if (targetTasks.length === 0) {
          newOrder = 0;
        } else if (targetIndex === 0) {
          newOrder = targetTasks[0].order - 1;
        } else if (targetIndex >= targetTasks.length) {
          newOrder = targetTasks[targetTasks.length - 1].order + 1;
        } else {
          const prevOrder = targetTasks[targetIndex - 1].order;
          const nextOrder = targetTasks[targetIndex].order;
          newOrder = (prevOrder + nextOrder) / 2;
        }
      }

      // Determine property updates based on cross-group drag
      let propertyUpdates: Partial<
        Pick<Task, "priority" | "deadline" | "isCompleted">
      > = {};

      if (sourceGroupId !== targetGroupId) {
        // Cross-group drag - determine property changes
        if (targetGroupId === "completed") {
          propertyUpdates.isCompleted = true;
        } else if (sourceGroupId === "completed") {
          propertyUpdates.isCompleted = false;
        }

        // Priority group changes
        if (targetGroupId.startsWith("priority:")) {
          const newPriority = targetGroup.groupValue as TaskPriorityType;
          propertyUpdates.priority = newPriority;
        }

        // Due date group changes
        if (targetGroupId === "dueDate:noDate") {
          propertyUpdates.deadline = undefined;
        }
      }

      await reorderTaskInGroup(taskId, newOrder, propertyUpdates);
    },
    [
      groupedTasks,
      reorderTaskInGroup,
      toDoSettings.sortBy,
      handleUpdateSetting,
      filteredTasks,
      normalizeTaskOrders,
    ],
  );

  return {
    // Data
    lists,
    selectedList: lists.find((l) => l.id === selectedListId),
    groupedTasks,
    taskIds,
    isLoaded,
    toDoSettings,
    allowsReorder,

    // Input State
    inputValue,
    setInputValue,
    isInputFocused,
    setIsInputFocused,
    priority,
    setPriority,
    deadline,
    setDeadline,

    // Search State
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,

    // Actions
    searchList,
    handleUpdateSetting,
    handleAddList,
    handleSelectList,
    handleBlur,
    handleAddTask,
    handleToggleTask,
    handleReorderTask,
  };
};
