import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@stores/todoStore";
import { useSettingsStore } from "@stores/settingsStore";
import { useToastStore } from "@stores/toastStore";
import { WidgetId, TaskSortBy, TaskPriorityType } from "@constants/common";
import { Tag, TaskList } from "@/types/toDo";
import { sortTasks } from "@utils/toDo/taskSortUtils";
import { groupTasks } from "@utils/toDo/taskGroupUtils";
import {
  calculateNewTaskOrder,
  getPropertyUpdatesForCrossGroupDrag,
  createNormalizedOrderGetter,
} from "@utils/toDo/taskReorderUtils";

export type { TaskGroup } from "@/types/toDo";

export const useTodo = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const {
    lists,
    tasks,
    tags,
    isLoaded,
    isSyncing,
    hasInitializedDefaultList,
    loading,

    loadData,
    searchList,
    addTask,
    addList,
    toggleTask,
    addTag,
    searchTag,
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TaskList[]>([]);
  const [searchTagsResults, setSearchTagsResults] = useState<Tag[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const debouncedTagSearchTerm = useDebounce(tagSearchTerm);

  useEffect(() => {
    if (!isLoaded) loadData();
  }, [isLoaded, loadData]);

  useEffect(() => {
    let cancelled = false;

    const debounceSearch = () => {
      if (!debouncedTagSearchTerm.trim()) {
        setSearchTagsResults(tags);
        return;
      }

      searchTag(debouncedTagSearchTerm).then((results) => {
        if (!cancelled) {
          setSearchTagsResults(results);
        }
      });
    };

    debounceSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedTagSearchTerm, searchTag, tags]);

  useEffect(() => {
    let cancelled = false;

    const debounceSearch = () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults(lists);
        return;
      }

      searchList(debouncedSearchTerm).then((results) => {
        if (!cancelled) {
          setSearchResults(results);
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
    if (
      isLoaded &&
      !isSyncing &&
      !hasInitializedDefaultList &&
      lists.length === 0
    ) {
      useTodoStore.setState({ hasInitializedDefaultList: true });
      addList(t("toDo.myDay")).then((newListId) => {
        handleUpdateSetting("selectedListId", newListId);
      });
    }
  }, [
    addList,
    handleUpdateSetting,
    isLoaded,
    isSyncing,
    hasInitializedDefaultList,
    lists.length,
    t,
  ]);

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
    const result = getTasksByList(selectedListId);
    return sortTasks(result, toDoSettings.sortBy);
  }, [selectedListId, tasks, toDoSettings.sortBy, getTasksByList]);

  const groupedTasks = useMemo(() => {
    return groupTasks(filteredTasks, toDoSettings.groupBy, t, { tags });
  }, [filteredTasks, toDoSettings.groupBy, t, tags]);

  // Get all task IDs in order for the flat list (needed for SortableContext)
  const taskIds = useMemo(() => {
    return groupedTasks.flatMap((g) => g.tasks.map((t) => t.id));
  }, [groupedTasks]);

  const getDisplayTags = useCallback(
    (tagIds: string[]) => {
      return tags.filter((tag) => tagIds.includes(tag.id));
    },
    [tags],
  );

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsInputFocused(false);
    }
  };

  const handleAddList = async () => {
    if (!searchTerm.trim()) return;

    try {
      const newListId = await addList(searchTerm);
      handleUpdateSetting("selectedListId", newListId);
      setSearchTerm("");

      addToast({
        type: "success",
        message: t("toDo.toast.listAdded"),
      });
    } catch (error) {
      console.log("Error adding list:", error);
      addToast({
        type: "error",
        message: t("toDo.toast.errorAddingList"),
        action: {
          label: t("toDo.toast.retry"),
          onClick: () => handleAddList(),
        },
      });
    }
  };

  const handleSelectList = (listId: string) => {
    handleUpdateSetting("selectedListId", listId);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedListId) return;

    const taskTitle = inputValue.trim();
    const taskPriority = priority;
    const taskDeadline = deadline;
    const taskTags = selectedTags;

    try {
      await addTask(selectedListId, taskTitle, {
        priority: taskPriority,
        deadline: taskDeadline,
        tags: taskTags,
      });

      // Clear form on success
      setInputValue("");
      setPriority(TaskPriorityType.NONE);
      setDeadline(undefined);
      setSelectedTags([]);

      addToast({
        type: "success",
        message: t("toDo.toast.taskAdded"),
      });
    } catch (error) {
      console.log("Error adding task:", error);
      addToast({
        type: "error",
        message: t("toDo.toast.errorAddingTask"),
        action: {
          label: t("toDo.toast.retry"),
          onClick: () =>
            addTask(selectedListId, taskTitle, {
              priority: taskPriority,
              deadline: taskDeadline,
              tags: taskTags,
            }),
        },
      });
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      const wasCompleted = task?.isCompleted ?? false;

      await toggleTask(taskId);

      addToast({
        type: "success",
        message: wasCompleted
          ? t("toDo.toast.taskUncompleted")
          : t("toDo.toast.taskCompleted"),
      });
    } catch (error) {
      console.log("Error toggling task:", error);
      addToast({
        type: "error",
        message: t("toDo.toast.errorTogglingTask"),
        action: {
          label: t("toDo.toast.retry"),
          onClick: () => toggleTask(taskId),
        },
      });
    }
  };

  // Handle reordering after drag ends
  const handleReorderTask = useCallback(
    async (
      taskId: string,
      targetIndex: number,
      targetGroupId: string,
      sourceGroupId: string,
    ) => {
      try {
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
        const targetTasks = targetGroup.tasks.filter((t) => t.id !== taskId);
        const getTaskOrder = switchingToManual
          ? createNormalizedOrderGetter(filteredTasks)
          : undefined;

        const newOrder = calculateNewTaskOrder(
          targetTasks,
          targetIndex,
          getTaskOrder,
        );

        // Get current task for tag handling
        const currentTask = tasks.find((t) => t.id === taskId);

        // Determine property updates based on cross-group drag
        const propertyUpdates = getPropertyUpdatesForCrossGroupDrag(
          sourceGroupId,
          targetGroupId,
          targetGroup.groupValue,
          currentTask?.tags,
        );

        await reorderTaskInGroup(taskId, newOrder, propertyUpdates);
        // No success toast for drag - too noisy
      } catch (error) {
        console.log("Error updating task:", error);
        addToast({
          type: "error",
          message: t("toDo.toast.errorUpdatingTask"),
        });
      }
    },
    [
      groupedTasks,
      reorderTaskInGroup,
      toDoSettings.sortBy,
      handleUpdateSetting,
      filteredTasks,
      normalizeTaskOrders,
      addToast,
      t,
      tasks,
    ],
  );

  const handleSelectTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((item) => item !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  return {
    // Data
    lists,
    tags,
    selectedList: lists.find((l) => l.id === selectedListId),
    groupedTasks,
    taskIds,
    isLoaded,
    toDoSettings,
    allowsReorder,
    loading,

    // Input State
    inputValue,
    setInputValue,
    isInputFocused,
    setIsInputFocused,
    priority,
    setPriority,
    deadline,
    setDeadline,
    selectedTags,
    handleSelectTag,

    // Search State
    searchTerm,
    setSearchTerm,
    searchResults,
    tagSearchTerm,
    setTagSearchTerm,
    searchTagsResults,

    // Actions
    addTag,
    searchTag,
    getDisplayTags,
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
